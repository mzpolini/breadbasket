/**
 * Takes out of the ledger what the farmer never put there.
 *
 * The ledger is append-only and has no delete, on purpose — a correction is a
 * new movement. That promise is about **his claims**. These rows are not
 * claims: a client bug replayed read-backs he had never approved, and one he
 * had explicitly corrected, into his record (ADR 0003). Compensating them with
 * further movements would keep the letter of the rule and leave his history
 * saying he told us something he never said.
 *
 * Prints its plan and changes nothing unless `--apply` is passed. Safe to run
 * twice: everything it does is keyed on what it finds, not on a fixed count.
 *
 *   pnpm dlx dotenv -e .env.local -- tsx scripts/cleanup-unapproved.ts
 *   pnpm dlx dotenv -e .env.local -- tsx scripts/cleanup-unapproved.ts --apply
 */
import { eq, inArray } from 'drizzle-orm'
import { getDb } from '../lib/db'
import { movements, type MovementRow } from '../lib/db/schema'

/**
 * Read-backs that reached the ledger without him approving them.
 *
 * Listed explicitly, with the evidence, because nothing in the data can prove
 * it: before the claims table existed there was no record of an approval, so
 * "never approved" is a reading of the transcript rather than a query. Every
 * entry here should name the conversation it came from.
 */
const NEVER_APPROVED: { proposalId: string; why: string }[] = [
  {
    proposalId: 'toolu_01M54iMhbPrB3YyUcjhJyKMM',
    why: 'the "sold out" read-back he corrected to "deer ate them" and never approved; replayed nine times a minute after the conversation moved on',
  },
]

/** Animals in his own words. Used only to file a loss he already described. */
const WILDLIFE = /deer|bird|crow|groundhog|rabbit|racc?oon|squirrel|possum|fox/i

async function main() {
  const apply = process.argv.includes('--apply')
  const db = getDb()
  const rows = await db.select().from(movements)

  const doomed = new Map<string, string>()

  for (const { proposalId, why } of NEVER_APPROVED) {
    for (const row of rows.filter((r) => r.proposalId === proposalId)) {
      doomed.set(row.id, why)
    }
  }

  // One approval writes one batch, and every movement in it shares the batch's
  // timestamp. Several timestamps under one proposal id means it was published
  // more than once — so keep the first batch and drop the repeats.
  const byProposal = new Map<string, MovementRow[]>()
  for (const row of rows) {
    if (!row.proposalId || doomed.has(row.id)) continue
    const group = byProposal.get(row.proposalId) ?? []
    group.push(row)
    byProposal.set(row.proposalId, group)
  }

  for (const [proposalId, group] of byProposal) {
    const batches = [...new Set(group.map((r) => r.occurredAt.toISOString()))].sort()
    if (batches.length < 2) continue

    for (const row of group) {
      if (row.occurredAt.toISOString() === batches[0]) continue
      doomed.set(
        row.id,
        `published once, written ${batches.length} times — proposal ${proposalId}`,
      )
    }
  }

  // `spoil` was a kind before it was a reason. Storage reads the old rows
  // correctly either way; this makes the stored row say what he said.
  const legacy = rows
    .filter((row) => row.kind === 'spoil' && !doomed.has(row.id))
    .map((row) => ({
      row,
      reason: WILDLIFE.test(row.rawPhrase ?? '') ? 'wildlife' : 'spoiled',
    }))

  console.log(`${rows.length} movements on record\n`)

  console.log(`${doomed.size} to delete:`)
  for (const [id, why] of doomed) {
    const row = rows.find((r) => r.id === id)!
    console.log(`  · ${row.product} — ${row.kind}, ${row.occurredAt.toISOString()}`)
    console.log(`      ${why}`)
  }

  console.log(`\n${legacy.length} to re-file as a reduction with a reason:`)
  for (const { row, reason } of legacy) {
    console.log(`  · ${row.product} — "${row.rawPhrase}" → remove, reason ${reason}`)
  }

  if (!apply) {
    console.log('\nNothing changed. Pass --apply to carry this out.')
    return
  }

  if (doomed.size > 0) {
    await db.delete(movements).where(inArray(movements.id, [...doomed.keys()]))
  }

  for (const { row, reason } of legacy) {
    await db.update(movements).set({ kind: 'remove', reason }).where(eq(movements.id, row.id))
  }

  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
