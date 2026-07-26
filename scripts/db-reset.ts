/**
 * Wipes movements. The table is append-only in the product — this is a dev tool
 * for getting back to a genuine cold start, which is the only way to see what a
 * farmer actually meets on his first visit.
 */
import { getDb } from '../lib/db'
import { movements } from '../lib/db/schema'

async function main() {
  const deleted = await getDb().delete(movements).returning({ id: movements.id })
  console.log(`cleared ${deleted.length} movements — the farm now knows nothing`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
