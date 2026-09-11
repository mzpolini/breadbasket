import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { publishedProposals as published } from '../db/schema'

/**
 * Which read-backs have been published — decided by the database rather than
 * remembered by a client.
 *
 * The promise is that nothing reaches the ledger he has not approved, and that
 * approving once writes once. A client bug published a read-back he had
 * **corrected** nine times over, and nothing downstream could tell: every
 * movement carried a fresh id, so the append's own conflict clause never fired
 * (ADR 0003).
 *
 * Recorded *before* the write rather than after, so a failure in between loses
 * a publish rather than duplicating one — he can always say it again, and
 * cannot un-say something recorded twice. `releasePublish` is how the losing
 * side of that trade is handed back, since the driver speaks HTTP and has no
 * transaction to hold the two writes together.
 */

/** Records this read-back as published. False means it already was. */
export async function publishOnce(farmId: string, proposalId: string): Promise<boolean> {
  const first = await getDb()
    .insert(published)
    .values({ farmId, proposalId, publishedAt: new Date() })
    .onConflictDoNothing()
    .returning({ proposalId: published.proposalId })

  return first.length > 0
}

/**
 * Undoes a record whose write did not land.
 *
 * Without this a failed append leaves the read-back permanently unpublishable:
 * the card dies on his screen with nothing written behind it, which is the one
 * outcome worse than writing twice.
 */
export async function releasePublish(farmId: string, proposalId: string): Promise<void> {
  await getDb()
    .delete(published)
    .where(and(eq(published.farmId, farmId), eq(published.proposalId, proposalId)))
}

/** Every read-back this farm has published. */
export async function publishedIds(farmId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ proposalId: published.proposalId })
    .from(published)
    .where(eq(published.farmId, farmId))

  return rows.map((row) => row.proposalId)
}
