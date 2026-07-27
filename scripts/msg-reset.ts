/** Clears the stored transcript only. Movements and vocabulary are untouched. */
import { getDb } from '../lib/db'
import { messages } from '../lib/db/schema'

async function main() {
  const cleared = await getDb().delete(messages).returning({ id: messages.id })
  console.log(`cleared ${cleared.length} messages — the ledger is untouched`)
}
main().catch((e) => { console.error(e); process.exit(1) })
