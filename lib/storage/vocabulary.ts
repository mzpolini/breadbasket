import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { vocabulary as table } from '../db/schema'
import { emptyVocabulary, learn, type Vocabulary } from '../vocabulary'

/**
 * Persistence for a farm's private language.
 *
 * The rules — normalisation, last-write-wins, unknown-terms-are-not-errors —
 * live in `lib/vocabulary` and are tested there without a database. This file
 * only moves rows, so those rules cannot quietly diverge between the pure module
 * and what is actually stored.
 */

export async function vocabularyFor(farmId: string): Promise<Vocabulary> {
  const rows = await getDb().select().from(table).where(eq(table.farmId, farmId))

  return rows.reduce(
    (vocab, row) => learn(vocab, row.term, row.product),
    emptyVocabulary(farmId),
  )
}

/**
 * Teach one mapping. Upserts because the most recent correction is the one he
 * meant — if he calls the same thing two different names on two occasions, the
 * later one wins rather than the write failing.
 */
export async function teach(farmId: string, term: string, product: string): Promise<void> {
  const key = term.trim().toLowerCase()
  if (!key || key === product.trim().toLowerCase()) return

  await getDb()
    .insert(table)
    .values({ farmId, term: key, product, learnedAt: new Date() })
    .onConflictDoUpdate({
      target: [table.farmId, table.term],
      set: { product, learnedAt: new Date() },
    })
}
