/** Prints the ledger for a farm — the one check that says whether a tap landed. */
import { movementsForFarm } from '../lib/storage/movements'

async function main() {
  const farmId = process.argv[2] || 'seed-farm'
  const all = await movementsForFarm(farmId)
  console.log(`${all.length} movements for ${farmId}`)
  for (const m of all) {
    const amount = m.amount ? `${m.amount.value} ${m.amount.unit}` : 'no amount'
    console.log(`  · ${m.product} — ${m.kind}, ${amount}, proposal ${m.proposalId ?? 'none'}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
