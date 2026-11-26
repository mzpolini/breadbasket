import { and, asc, gte, lt } from 'drizzle-orm'
import { listClerkAccounts } from '../admin/clerk-accounts'
import { getDb } from '../db'
import { farms, messages, movements, notes, users } from '../db/schema'
import { isReviewableFarm, renderSessions, spokenText, type SessionFarm } from './brief'

const DAY = 24 * 60 * 60 * 1000

function personName(
  userId: string | null,
  emails: Map<string, string | null>,
  names: Map<string, string | null>,
): string {
  if (!userId) return 'someone on the farm'
  return names.get(userId) || emails.get(userId) || 'someone on the farm'
}

function publishedLine(row: {
  product: string
  amountValue: number | null
  amountUnit: string | null
  state: string
  measured: boolean
}): string {
  const amount =
    row.amountValue == null
      ? 'no amount'
      : `${row.amountValue} ${row.amountUnit ?? ''}`.trim()
  const weighed = row.measured ? 'weighed' : 'estimated'
  return `${row.product}: ${amount}, ${weighed} (${row.state})`
}

/**
 * Farmer sessions in a window, rendered for the model.
 *
 * The demo farm is left out: its stock is a script. The founder farm stays in,
 * labeled, so a test of the product is not briefed as a new alpha farmer.
 */
export async function loadWindow(from: Date, to: Date): Promise<{ text: string; sessionCount: number }> {
  const db = getDb()
  const [farmRows, userRows, messageRows, movementRows, noteRows, accounts] = await Promise.all([
    db.select().from(farms),
    db.select().from(users),
    db
      .select()
      .from(messages)
      .where(and(gte(messages.createdAt, from), lt(messages.createdAt, to)))
      .orderBy(asc(messages.createdAt)),
    db
      .select()
      .from(movements)
      .where(and(gte(movements.occurredAt, from), lt(movements.occurredAt, to)))
      .orderBy(asc(movements.occurredAt)),
    db
      .select()
      .from(notes)
      .where(and(gte(notes.createdAt, from), lt(notes.createdAt, to)))
      .orderBy(asc(notes.createdAt)),
    listClerkAccounts(),
  ])

  const farmName = new Map(farmRows.map((farm) => [farm.id, farm.name]))
  const emails = new Map(userRows.map((user) => [user.id, user.email]))
  const names = new Map((accounts ?? []).map((account) => [account.id, account.name]))

  const byFarm = new Map<string, SessionFarm>()
  const ensure = (farmId: string, personId: string | null) => {
    const existing = byFarm.get(farmId)
    if (existing) return existing
    const created: SessionFarm = {
      farmId,
      farmName: farmName.get(farmId) ?? farmId,
      person: personName(personId, emails, names),
      lines: [],
      published: [],
      notes: [],
    }
    byFarm.set(farmId, created)
    return created
  }

  for (const row of messageRows) {
    if (!isReviewableFarm(row.farmId)) continue
    const text = spokenText(row.parts)
    if (!text) continue
    const session = ensure(row.farmId, row.postedBy)
    if (row.postedBy) session.person = personName(row.postedBy, emails, names)
    session.lines.push({
      at: row.createdAt,
      who: row.role === 'user' ? 'farmer' : 'breadbasket',
      text,
    })
  }

  for (const row of movementRows) {
    if (!isReviewableFarm(row.farmId)) continue
    ensure(row.farmId, row.postedBy).published.push(publishedLine(row))
  }

  for (const row of noteRows) {
    if (!isReviewableFarm(row.farmId)) continue
    ensure(row.farmId, row.postedBy).notes.push(row.note)
  }

  const sessions = [...byFarm.values()].filter(
    (session) => session.lines.length > 0 || session.published.length > 0 || session.notes.length > 0,
  )
  return { text: renderSessions(sessions), sessionCount: sessions.length }
}

/** Where the next briefing starts: the end of the last one, or a day ago. */
export function windowStart(lastCoveredTo: Date | null, now: Date): Date {
  return lastCoveredTo ?? new Date(now.getTime() - DAY)
}
