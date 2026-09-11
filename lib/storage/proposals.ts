import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { publishedProposals as claims } from '../db/schema'

/**
 * Which read-backs have been published — enforced by the database rather than
 * remembered by a client.
 *
 * The promise is that nothing reaches the ledger that he has not approved, and
 * that approving once writes once. A client bug replayed a read-back he had
 * **corrected** into the ledger nine times, and nothing downstream could tell:
 * every movement carried a fresh id, so the append's own conflict clause never
 * fired (ADR 0003).
 *
 * The claim is taken *before* the write, so a crash between the two loses a
 * publish rather than duplicating one. He can always say it again; he cannot
 * un-say something recorded twice.
 */
export async function claimProposal(farmId: string, proposalId: string): Promise<boolean> {
  const claimed = await getDb()
    .insert(claims)
    .values({ farmId, proposalId, publishedAt: new Date() })
    .onConflictDoNothing()
    .returning({ proposalId: claims.proposalId })

  return claimed.length > 0
}

/** Whether this read-back has already been published, without claiming it. */
export async function proposalClaimed(farmId: string, proposalId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ proposalId: claims.proposalId })
    .from(claims)
    .where(and(eq(claims.farmId, farmId), eq(claims.proposalId, proposalId)))

  return rows.length > 0
}

/** Every claim on record for a farm. */
export async function claimedProposals(farmId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ proposalId: claims.proposalId })
    .from(claims)
    .where(eq(claims.farmId, farmId))

  return rows.map((row) => row.proposalId)
}
