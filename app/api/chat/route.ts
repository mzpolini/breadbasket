import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  TypeValidationError,
  validateUIMessages,
} from 'ai'
import { AGENT_INSTRUCTIONS } from '@/lib/agent/instructions'
import { FARM_TIME_ZONE } from '@/lib/seed'
import { farmTools } from '@/lib/agent/tools'
import type { FarmUIMessage } from '@/lib/agent/ui-message'
import { checkFarmAccess } from '@/lib/auth/current-user'
import { messagesForFarm, recentForContext, saveMessages } from '@/lib/storage/messages'
import { notesForFarm } from '@/lib/storage/notes'

/**
 * The conversation.
 *
 * Routed through the AI Gateway with a plain `provider/model` string, which
 * authenticates via the OIDC token Vercel provisions — no provider key is
 * handled here. Model IDs came from the gateway's live list rather than memory;
 * note gateway slugs use dots, so they are not interchangeable with the
 * direct-API form.
 *
 * One model for now. The research memo argued for a cheap parser plus a better
 * conversational model, and that split stays available — but at one farmer the
 * token cost is a rounding error and a single model is one fewer thing to be
 * wrong about.
 *
 * **The transcript is stored; the context is bounded.** The client sends only
 * the message he just typed, the history is loaded here, and only a recent
 * window of it reaches the model. That is affordable because the transcript is
 * not the agent's memory: what the farm has is folded from movements, and the
 * agent reads that with `getCurrentStock` rather than by remembering.
 */
export const maxDuration = 30

/**
 * Roughly a dozen turns — enough for "no, the other greens" to make sense, far
 * short of enough for six weeks of small talk to crowd out today's sentence.
 */
const CONTEXT_MESSAGES = 24

/**
 * The standing facts, newest first, appended to the system prompt.
 *
 * Newest first because notes are append-only: when he changes his picking days
 * both are on record, and order is the only thing telling the model which one
 * still holds. Empty when he has told us nothing, so a new farm carries no
 * heading for a section with nothing under it.
 */
function standingFacts(notes: { note: string }[]): string {
  if (notes.length === 0) return ''

  return [
    '\n\n## What he has told you about this farm',
    'Most recent first — where two say different things, the first one is true now.',
    ...notes.map((row) => `- ${row.note}`),
  ].join('\n')
}

/**
 * What day it is, on the farm.
 *
 * Without this the agent has no clock at all, and "head lettuce in about two
 * weeks" came back as a forecast with no dates — which is a claim the ledger
 * has nowhere to put. Both forms are given because it reasons in words and
 * writes in `YYYY-MM-DD`.
 */
function todayOnTheFarm(now: Date): string {
  const spoken = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: FARM_TIME_ZONE,
  })
  // en-CA gives YYYY-MM-DD, which is the shape every date field here expects.
  const iso = now.toLocaleDateString('en-CA', { timeZone: FARM_TIME_ZONE })

  return `\n\n## What day it is\n\nToday is ${spoken} — ${iso}. Every date you write comes off that.`
}

export async function POST(req: Request) {
  const { message, farmId }: { message: FarmUIMessage; farmId: string } = await req.json()

  const access = await checkFarmAccess(farmId)
  if (!access.ok) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: access.status })
  }

  const tools = farmTools(farmId)
  const history = await messagesForFarm(farmId)
  const conversation = [...history, message]

  // Persist what he said before the model runs. If the request dies mid-stream
  // his sentence is still on the record — losing it is the failure this exists
  // to prevent.
  await saveMessages(farmId, [message])

  let forModel: FarmUIMessage[]
  try {
    forModel = await validateUIMessages<FarmUIMessage>({
      messages: recentForContext(conversation, CONTEXT_MESSAGES),
      tools,
    })
  } catch (error) {
    if (!TypeValidationError.isInstance(error)) throw error
    // Stored turns predate a tool-schema change. His transcript is intact and
    // still renders; the model just starts this turn without the older context.
    console.error('stored messages failed validation, continuing without history', error)
    forModel = [message]
  }

  const result = streamText({
    model: 'anthropic/claude-sonnet-5',
    // Notes ride in the system prompt rather than behind a tool, because the
    // agent must not have to *remember to ask* what it knows about the farm —
    // that is the failure this replaced. The window only holds a dozen turns, so
    // anything not carried here is gone by the next conversation.
    instructions:
      AGENT_INSTRUCTIONS +
      todayOnTheFarm(new Date()) +
      standingFacts(await notesForFarm(farmId)),
    messages: await convertToModelMessages(forModel),
    tools,
    // Enough to look at his stock, resolve his words, and read back — no more.
    stopWhen: isStepCount(6),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: conversation,
      // Without this the response message carries no id at all, so every
      // assistant turn collides on the same empty primary key and each reply
      // silently overwrites the last one. The transcript looks plausible —
      // it just quietly holds one assistant message forever.
      generateMessageId: () => crypto.randomUUID(),
      onEnd: async ({ messages: finished }) => {
        // Filtered by id rather than sliced by index, so this is correct whether
        // `finished` is the whole conversation or only the new turn — and
        // awaited, because a fire-and-forget write can lose the race with the
        // function shutting down once the response has been sent.
        const alreadyStored = new Set(history.map((m) => m.id))
        await saveMessages(
          farmId,
          finished.filter((m) => !alreadyStored.has(m.id)),
        )
      },
    }),
  })
}
