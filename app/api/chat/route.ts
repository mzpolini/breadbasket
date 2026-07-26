import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { AGENT_INSTRUCTIONS } from '@/lib/agent/instructions'
import { farmTools } from '@/lib/agent/tools'
import { SEED_FARM_ID } from '@/lib/seed'

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
 */
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'anthropic/claude-sonnet-5',
    instructions: AGENT_INSTRUCTIONS,
    messages: await convertToModelMessages(messages),
    tools: farmTools(SEED_FARM_ID),
    // Enough to look at his stock, resolve his words, and read back — no more.
    stopWhen: isStepCount(6),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
