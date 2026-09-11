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
 * **Only ever deletes.** It does not re-file or rewrite anything: rows carrying
 * the old `spoil` kind are his claims, and storage already reads them as a
 * reduction whose reason is spoilage, so there is nothing here to fix. The one
 * row where that reading was wrong — his "Deer ate them", recorded as spoilage
 * because spoilage was the only kind on offer — was re-filed once, by hand,
 * against his own sentence rather than against a guess about it.
 *
 * Prints its plan and changes nothing unless `--apply` is passed. Safe to run
 * twice: everything it does is keyed on what it finds, not on a fixed count.
 *
 *   pnpm dlx dotenv -e .env.local -- tsx scripts/cleanup-unapproved.ts
 *   pnpm dlx dotenv -e .env.local -- tsx scripts/cleanup-unapproved.ts --apply
 */
import { inArray } from 'drizzle-orm'
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

async function main() {
  const apply = process.argv.includes('--apply')
  const db = getDb()
  const rows = await db.select().from(movements)

  const toDelete = new Map<string, string>()

  for (const { proposalId, why } of NEVER_APPROVED) {
    for (const row of rows.filter((r) => r.proposalId === proposalId)) {
      toDelete.set(row.id, why)
    }
  }

  // One approval writes one batch, and every movement in it shares the batch's
  // timestamp — so several timestamps under one proposal id is not a reading of
  // his intent, it is proof of a second write of one read-back. Keep the first
  // batch, which is the publish he asked for, and drop the repeats.
  const byProposal = new Map<string, MovementRow[]>()
  for (const row of rows) {
    if (!row.proposalId || toDelete.has(row.id)) continue
    const group = byProposal.get(row.proposalId) ?? []
    group.push(row)
    byProposal.set(row.proposalId, group)
  }

  for (const [proposalId, group] of byProposal) {
    const batches = [...new Set(group.map((r) => r.occurredAt.toISOString()))].sort()
    if (batches.length < 2) continue

    for (const row of group) {
      if (row.occurredAt.toISOString() === batches[0]) continue
      toDelete.set(
        row.id,
        `published once, written ${batches.length} times — proposal ${proposalId}`,
      )
    }
  }

  console.log(`${rows.length} movements on record\n`)

  console.log(`${toDelete.size} to delete:`)
  for (const [id, why] of toDelete) {
    const row = rows.find((r) => r.id === id)!
    console.log(`  · ${row.product} — ${row.kind}, ${row.occurredAt.toISOString()}`)
    console.log(`      ${why}`)
  }

  if (!apply) {
    console.log('\nNothing changed. Pass --apply to carry this out.')
    return
  }

  if (toDelete.size > 0) {
    await db.delete(movements).where(inArray(movements.id, [...toDelete.keys()]))
  }

  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
