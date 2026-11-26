import { generateText, Output } from 'ai'
import { z } from 'zod'
import {
  CHAT_INSTRUCTIONS,
  quietDraft,
  renderHistory,
  REVIEW_INSTRUCTIONS,
  disposition,
  type Proposal,
  type ReportDraft,
} from './brief'
import { loadWindow, windowStart } from './gather'
import {
  insertAidminMessage,
  insertReport,
  latestReport,
  listAidminMessages,
  listReports,
} from '../storage/aidmin'

/**
 * Opus, through the same gateway the farmer conversation uses. The farmer
 * hears Sonnet; this briefing is the one place that should read slowly.
 */
const MODEL = 'anthropic/claude-opus-5.5'

const draftSchema = z.object({
  urgency: z.enum(['calm', 'watch', 'emergency']),
  title: z.string(),
  narrative: z.string(),
  farmers: z.array(
    z.object({
      name: z.string(),
      farm: z.string(),
      read: z.string(),
    }),
  ),
  proposals: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      change: z.string(),
    }),
  ),
})

async function history(): Promise<string> {
  const [reports, messages] = await Promise.all([listReports(12), listAidminMessages(40)])
  return renderHistory(
    reports.map((report) => ({
      kind: report.kind,
      urgency: report.urgency,
      title: report.title,
      narrative: report.narrative,
      proposals: report.proposals as Proposal[],
      createdAt: report.createdAt,
    })),
    messages.map((message) => ({
      role: message.role === 'admin' ? 'admin' : 'AIdmin',
      body: message.body,
      createdAt: message.createdAt,
    })),
  )
}

async function readSessions(prompt: string): Promise<ReportDraft> {
  const result = await generateText({
    model: MODEL,
    instructions: REVIEW_INSTRUCTIONS,
    prompt,
    output: Output.object({ schema: draftSchema, name: 'briefing' }),
  })
  return result.output
}

/**
 * Read whatever farmers have said since the last briefing.
 *
 * A daily run always leaves a row, including a quiet one, so the morning has
 * an answer. A scan leaves a row only when someone is stuck — an emergency
 * is a briefing, not a second copy of a calm day.
 */
export async function runReview(mode: 'daily' | 'scan', now = new Date()): Promise<{ wrote: boolean }> {
  const last = await latestReport()
  const from = windowStart(last?.coveredTo ?? null, now)
  const window = await loadWindow(from, now)
  const prior = await history()

  // A second look at a window that is still empty should not file the same
  // "nobody talked" note again. The morning run is a day later, so it still files.
  if (
    window.sessionCount === 0 &&
    last?.title === 'No new sessions' &&
    now.getTime() - last.createdAt.getTime() < 60 * 60 * 1000
  ) {
    return { wrote: false }
  }

  let draft: ReportDraft
  if (window.sessionCount === 0) {
    draft = quietDraft()
  } else {
    draft = await readSessions(
      `${prior}\n\n# Sessions since the last briefing\nJudge these. The earlier reports are context.\n\n${window.text}`,
    )
  }

  const kind = disposition(mode, draft.urgency, window.sessionCount > 0)
  if (kind === 'skip') return { wrote: false }

  await insertReport({
    kind,
    urgency: draft.urgency,
    title: draft.title,
    narrative: draft.narrative,
    farmers: draft.farmers,
    proposals: draft.proposals,
    coveredFrom: from,
    coveredTo: now,
  })
  return { wrote: true }
}

/** One turn with the admins. Their words are kept even if the reply fails. */
export async function replyToAdmin(adminId: string, text: string): Promise<string> {
  await insertAidminMessage({ role: 'admin', body: text, postedBy: adminId })
  const prior = await history()
  const last = await latestReport()
  const sessions = last ? await loadWindow(last.coveredFrom, last.coveredTo) : { text: '', sessionCount: 0 }
  const transcript =
    sessions.sessionCount > 0 ? `\n\n# Sessions the latest briefing read\n${sessions.text}` : ''

  const result = await generateText({
    model: MODEL,
    instructions: CHAT_INSTRUCTIONS,
    prompt: `${prior}${transcript}\n\nRespond to the latest thing an admin said.`,
  })
  const reply = result.text.trim()
  await insertAidminMessage({ role: 'aidmin', body: reply, postedBy: null })
  return reply
}
