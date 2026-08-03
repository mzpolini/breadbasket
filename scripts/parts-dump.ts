/** Dumps every part of every stored message, so a missing tool call is visible. */
import { messagesForFarm } from '../lib/storage/messages'

async function main() {
  const farmId = process.argv[2] || 'seed-farm'
  const all = await messagesForFarm(farmId)
  console.log(`${all.length} messages for ${farmId}\n`)
  for (const m of all) {
    console.log(`[${m.role}] ${m.id}`)
    for (const p of m.parts) {
      const extra =
        p.type === 'text'
          ? JSON.stringify((p as { text: string }).text).slice(0, 80)
          : JSON.stringify(p).slice(0, 200)
      console.log(`    · ${p.type} ${extra}`)
    }
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
