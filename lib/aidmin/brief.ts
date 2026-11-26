import { FARM_TIME_ZONE } from '../seed'

/**
 * The sample farm the directory team maps against. It is not a person, and a
 * briefing that treated its scripted stock as a farmer would be lying.
 */
export const DEMO_FARM_ID = 'farm_demofarm001'

/** The founder's own farm, kept so a test session isn't reported as an alpha farmer. */
export const SEED_FARM_ID = 'seed-farm'

export type Urgency = 'calm' | 'watch' | 'emergency'

export type FarmerRead = { name: string; farm: string; read: string }

export type Proposal = { title: string; why: string; change: string }

export type ReportDraft = {
  urgency: Urgency
  title: string
  narrative: string
  farmers: FarmerRead[]
  proposals: Proposal[]
}

export type SessionLine = { at: Date; who: 'farmer' | 'breadbasket'; text: string }

export type SessionFarm = {
  farmId: string
  farmName: string
  person: string
  lines: SessionLine[]
  /** What the ledger actually kept, so a read-back that never published is visible. */
  published: string[]
  /** Facts that aren't stock — picking days, harvest to order — kept beside the ledger. */
  notes: string[]
}

/** A daily run always leaves a row. A scan leaves one only when someone is stuck. */
export function disposition(
  mode: 'daily' | 'scan',
  urgency: Urgency,
  hasSessions: boolean,
): 'daily' | 'emergency' | 'skip' {
  if (!hasSessions) return mode === 'daily' ? 'daily' : 'skip'
  if (mode === 'scan' && urgency !== 'emergency') return 'skip'
  return urgency === 'emergency' ? 'emergency' : 'daily'
}

export function isReviewableFarm(farmId: string): boolean {
  return farmId !== DEMO_FARM_ID
}

/** The words a person or the agent actually said. Tool machinery is not a turn. */
export function spokenText(parts: unknown): string {
  if (!Array.isArray(parts)) return ''
  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const record = part as { type?: string; text?: string }
      return record.type === 'text' && typeof record.text === 'string' ? record.text.trim() : ''
    })
    .filter(Boolean)
    .join('\n')
}

function stamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: FARM_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * The window, as a colleague would want it: who, when, the words, and what
 * the ledger kept. The model is not handed raw message parts.
 */
export function renderSessions(farms: SessionFarm[]): string {
  if (farms.length === 0) return ''
  return farms
    .map((farm) => {
      const note = farm.farmId === SEED_FARM_ID ? '\nThis is the founder test farm, not an alpha farmer.' : ''
      const lines = farm.lines.map((line) => `[${stamp(line.at)}] ${line.who}: ${line.text}`).join('\n')
      const published =
        farm.published.length > 0
          ? `\nLedger kept:\n${farm.published.map((row) => `- ${row}`).join('\n')}`
          : '\nLedger kept: nothing.'
      const notes =
        farm.notes.length > 0
          ? `\nNotes kept:\n${farm.notes.map((row) => `- ${row}`).join('\n')}`
          : '\nNotes kept: nothing.'
      return `## ${farm.farmName} — ${farm.person}${note}\n${lines}${published}${notes}`
    })
    .join('\n\n')
}

export function renderHistory(
  reports: { kind: string; urgency: string; title: string; narrative: string; proposals: Proposal[]; createdAt: Date }[],
  messages: { role: string; body: string; createdAt: Date }[],
): string {
  const reportBlock =
    reports.length === 0
      ? 'No earlier reports.'
      : reports
          .map((report) => {
            const proposals =
              report.proposals.length === 0
                ? ''
                : `\nProposals:\n${report.proposals.map((p) => `- ${p.title}: ${p.change}`).join('\n')}`
            return `## ${report.title} (${report.kind}, ${report.urgency}, ${stamp(report.createdAt)})\n${report.narrative}${proposals}`
          })
          .join('\n\n')

  const guidance =
    messages.length === 0
      ? 'The admins have not said anything yet.'
      : messages
          .map((message) => `[${stamp(message.createdAt)}] ${message.role}: ${message.body}`)
          .join('\n\n')

  return `# Earlier reports\nNewest first. A session already covered here is context, not news.\n\n${reportBlock}\n\n# What the admins have told you\nThis is guidance. Follow it.\n\n${guidance}`
}

export function quietDraft(): ReportDraft {
  return {
    urgency: 'calm',
    title: 'No new sessions',
    narrative: 'Nobody talked to Breadbasket in this window.',
    farmers: [],
    proposals: [],
  }
}

export const REVIEW_INSTRUCTIONS = `You are AIdmin. You read Breadbasket farmer sessions and brief the human admins.

A farmer says what they have, in their own words. Breadbasket reads it back. Nothing is published until the farmer agrees. What they have is a ledger: amounts can be missing on purpose, because "I've got kale" is a real claim.

Write like a colleague briefing the team. Name the person and the farm. Say whether it seemed to click, where they struggled, what they entered, and what they stopped short of. Thin data is worth saying — "she got the herbs up, and it seemed intuitive, but she never said how much, and she didn't say what was coming or what sold out; the next thing is to get her to enter more" — and it is not an emergency.

Urgency:
- calm: they got through it. Missing amounts, or stopping once the list was up, is calm.
- watch: a correction they had to repeat, confusion that resolved, or a place the product clearly constrained them.
- emergency: they were stuck, frustrated, or left without publishing something they were trying to say. Fighting a read-back and giving up is an emergency. Publishing and leaving is not.

Look for frustration in the words: a read-back they rejected, the same question asked again, a short reply after a long struggle, speech the agent kept getting wrong, or a confirmation the ledger does not show.

The ledger is append-only. A later trueup is the figure that counts for that product; an earlier line with no amount is history, not a second listing. A line marked estimated was stored that way on purpose — do not propose adding an estimate flag. Do propose showing the estimate to a buyer if the session suggests the page would hide it. Notes are where non-stock facts are kept (picking days, harvest to order). If a note was kept, it was stored. A buyer still may not see it, and that gap is fair to name.

Proposals are schema or technical changes this window forces. Name what a real sentence could not be stored as, and the change that would hold it. If the current shape held what they said, proposals is an empty list. Do not invent a roadmap.

Earlier reports and what admins have told you are context. Do not re-report a handled session as news. Follow their guidance about a person or a kind of problem.

The founder test farm is not an alpha farmer.`

export const CHAT_INSTRUCTIONS = `You are AIdmin, talking with the human admins of Breadbasket.

You have the briefings you already wrote and the sessions behind the latest one. Answer from those. When an admin tells you how to handle a person or a kind of problem, take it as guidance you will apply next time, and say so plainly.

You may propose a schema or technical change when a real session shows the product cannot hold what a farmer said. You cannot make the change yourself, and you do not claim you have. If the sessions do not force a change, do not propose one.

Write in plain sentences. Name the farmer.`
