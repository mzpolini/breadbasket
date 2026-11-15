import { and, count, eq, gte, isNotNull, max, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { ADMIN_TIME_ZONE, type DayCount, type PostingFacts } from '../admin'
import { invitations, messages, movements, notes, publishedProposals, users } from '../db/schema'

/**
 * The aggregate reads behind the admin panel. Each is one grouped query —
 * the pilot is small, but a page that loops a query per farm or per person is
 * the kind that is fine until the day it isn't.
 */

/** Per person: when they last sent a message, and how many they've sent. */
export async function postingByPerson(): Promise<PostingFacts[]> {
  const rows = await getDb()
    .select({
      postedBy: messages.postedBy,
      lastPostedAt: max(messages.createdAt),
      messages: count(),
    })
    .from(messages)
    .where(and(eq(messages.role, 'user'), isNotNull(messages.postedBy)))
    .groupBy(messages.postedBy)
  return rows.flatMap((r) =>
    r.postedBy && r.lastPostedAt
      ? [{ postedBy: r.postedBy, lastPostedAt: r.lastPostedAt, messages: Number(r.messages) }]
      : [],
  )
}

export type FarmActivity = {
  farmId: string
  people: number
  lastSpokenAt: Date | null
  messages7d: number
  messagesTotal: number
  movements7d: number
  openInvitations: number
}

/** Per farm: people, last spoken, and the week's volume. Farms with nothing are absent. */
export async function activityByFarm(since: Date): Promise<Map<string, FarmActivity>> {
  const db = getDb()
  const [msg, mov, ppl, inv] = await Promise.all([
    db
      .select({
        farmId: messages.farmId,
        last: max(messages.createdAt),
        total: count(),
        recent: sql<number>`count(*) filter (where ${messages.createdAt} >= ${since.toISOString()})`,
      })
      .from(messages)
      .where(eq(messages.role, 'user'))
      .groupBy(messages.farmId),
    db
      .select({ farmId: movements.farmId, recent: count() })
      .from(movements)
      .where(gte(movements.occurredAt, since))
      .groupBy(movements.farmId),
    db
      .select({ farmId: users.farmId, people: count() })
      .from(users)
      .where(isNotNull(users.farmId))
      .groupBy(users.farmId),
    db
      .select({ farmId: invitations.farmId, open: count() })
      .from(invitations)
      .where(sql`${invitations.acceptedAt} is null and ${invitations.revokedAt} is null`)
      .groupBy(invitations.farmId),
  ])

  const out = new Map<string, FarmActivity>()
  const get = (farmId: string) => {
    let row = out.get(farmId)
    if (!row) {
      row = {
        farmId,
        people: 0,
        lastSpokenAt: null,
        messages7d: 0,
        messagesTotal: 0,
        movements7d: 0,
        openInvitations: 0,
      }
      out.set(farmId, row)
    }
    return row
  }
  for (const r of msg) {
    const row = get(r.farmId)
    row.lastSpokenAt = r.last
    row.messagesTotal = Number(r.total)
    row.messages7d = Number(r.recent)
  }
  for (const r of mov) get(r.farmId).movements7d = Number(r.recent)
  for (const r of ppl) if (r.farmId) get(r.farmId).people = Number(r.people)
  for (const r of inv) get(r.farmId).openInvitations = Number(r.open)
  return out
}

/** Messages sent, and distinct people sending, per local day since `since`. */
export async function dailyActivity(since: Date): Promise<DayCount[]> {
  // The zone is a constant, inlined: as a bound parameter, Postgres sees the
  // SELECT and GROUP BY copies as different expressions ($1 vs $2) and refuses.
  const day = sql<string>`to_char(${messages.createdAt} at time zone ${sql.raw(`'${ADMIN_TIME_ZONE}'`)}, 'YYYY-MM-DD')`
  const rows = await getDb()
    .select({
      day,
      messages: count(),
      people: sql<number>`count(distinct ${messages.postedBy})`,
    })
    .from(messages)
    .where(and(eq(messages.role, 'user'), gte(messages.createdAt, since)))
    .groupBy(day)
  return rows.map((r) => ({ day: r.day, messages: Number(r.messages), people: Number(r.people) }))
}

export type UsageTotals = {
  messages7d: number
  movements7d: number
  published7d: number
  notes7d: number
}

/** The week's volume, across every farm. */
export async function usageSince(since: Date): Promise<UsageTotals> {
  const db = getDb()
  const [[m], [mv], [p], [n]] = await Promise.all([
    db
      .select({ n: count() })
      .from(messages)
      .where(and(eq(messages.role, 'user'), gte(messages.createdAt, since))),
    db.select({ n: count() }).from(movements).where(gte(movements.occurredAt, since)),
    db
      .select({ n: count() })
      .from(publishedProposals)
      .where(gte(publishedProposals.publishedAt, since)),
    db.select({ n: count() }).from(notes).where(gte(notes.createdAt, since)),
  ])
  return {
    messages7d: Number(m?.n ?? 0),
    movements7d: Number(mv?.n ?? 0),
    published7d: Number(p?.n ?? 0),
    notes7d: Number(n?.n ?? 0),
  }
}

/** Every invitation, for the people table. */
export async function listAllInvitations() {
  return getDb().select().from(invitations)
}

/** Every user row. */
export async function listAllUsers() {
  return getDb().select().from(users)
}
