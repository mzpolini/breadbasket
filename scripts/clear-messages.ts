import { getDb } from '../lib/db'
import { messages } from '../lib/db/schema'

async function main() {
  const cleared = await getDb().delete(messages).returning({ id: messages.id })
  console.log(`cleared ${cleared.length} messages`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
