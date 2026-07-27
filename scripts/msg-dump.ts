/** Prints the stored transcript — role, part kinds, and a text preview. */
import { messagesForFarm } from '../lib/storage/messages'
import { SEED_FARM_ID } from '../lib/seed'

async function main() {
  const all = await messagesForFarm(SEED_FARM_ID)
  console.log(`${all.length} messages stored\n`)
  for (const m of all) {
    const kinds = m.parts.map((p) => p.type).join(', ')
    const text = m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ')
      .slice(0, 90)
    console.log(`[${m.role}] ${kinds}\n    ${text}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
