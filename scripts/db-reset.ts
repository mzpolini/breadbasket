/**
 * Wipes the farm's memory — movements and vocabulary both.
 *
 * The tables are append-only and accreting in the product; this is a dev tool
 * for getting back to a genuine cold start, which is the only way to see what a
 * farmer actually meets on his first visit. Clearing movements without clearing
 * vocabulary would leave a farm that knows his words but not his crops.
 */
import { getDb } from '../lib/db'
import { movements, vocabulary } from '../lib/db/schema'

async function main() {
  const clearedMovements = await getDb().delete(movements).returning({ id: movements.id })
  const clearedTerms = await getDb().delete(vocabulary).returning({ term: vocabulary.term })

  console.log(
    `cleared ${clearedMovements.length} movements and ${clearedTerms.length} learned words — the farm now knows nothing`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
