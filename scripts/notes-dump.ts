/** Prints a farm's standing facts, newest first — what the agent gets handed. */
import { notesForFarm } from '../lib/storage/notes'

async function main() {
  const farmId = process.argv[2] || 'seed-farm'
  const all = await notesForFarm(farmId)
  console.log(`${all.length} notes for ${farmId}`)
  for (const row of all) {
    console.log(`  · ${row.note}   (${row.createdAt.toISOString()})`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
