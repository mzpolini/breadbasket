import { and, asc, desc, eq, gte } from 'drizzle-orm'
import { getDb } from '../db'
import {
  aidminMessages,
  aidminReports,
  type AidminMessageRow,
  type AidminReportRow,
} from '../db/schema'
import type { FarmerRead, Proposal, Urgency } from '../aidmin/brief'

export type NewAidminReport = {
  kind: 'daily' | 'emergency'
  urgency: Urgency
  title: string
  narrative: string
  farmers: FarmerRead[]
  proposals: Proposal[]
  coveredFrom: Date
  coveredTo: Date
}

export async function latestReport(): Promise<AidminReportRow | null> {
  const rows = await getDb()
    .select()
    .from(aidminReports)
    .orderBy(desc(aidminReports.createdAt))
    .limit(1)
  return rows[0] ?? null
}

/** Newest first. The next briefing reads these so it is not meeting the day cold. */
export async function listReports(limit = 30): Promise<AidminReportRow[]> {
  return getDb().select().from(aidminReports).orderBy(desc(aidminReports.createdAt)).limit(limit)
}

export async function insertReport(report: NewAidminReport): Promise<string> {
  const id = crypto.randomUUID()
  await getDb()
    .insert(aidminReports)
    .values({ ...report, id, createdAt: new Date() })
  return id
}

/** Oldest first, so the thread reads in the order it happened. */
export async function listAidminMessages(limit = 80): Promise<AidminMessageRow[]> {
  const rows = await getDb()
    .select()
    .from(aidminMessages)
    .orderBy(desc(aidminMessages.createdAt))
    .limit(limit)
  return rows.reverse()
}

export async function insertAidminMessage(message: {
  role: 'admin' | 'aidmin'
  body: string
  postedBy: string | null
}): Promise<void> {
  await getDb()
    .insert(aidminMessages)
    .values({
      id: crypto.randomUUID(),
      role: message.role,
      body: message.body,
      postedBy: message.postedBy,
      createdAt: new Date(),
    })
}

export async function recentEmergencyCount(since: Date): Promise<number> {
  const rows = await getDb()
    .select({ id: aidminReports.id })
    .from(aidminReports)
    .where(and(eq(aidminReports.urgency, 'emergency'), gte(aidminReports.createdAt, since)))
  return rows.length
}
