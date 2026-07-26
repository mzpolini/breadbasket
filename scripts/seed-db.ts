/**
 * Writes the worked example into the real database.
 *
 * Idempotent by movement id, so re-running replaces nothing — which is the
 * point: the table is append-only, and a seed that quietly rewrote history
 * would be lying about the one property the ledger depends on.
 *
 * Run with `pnpm db:seed`. It needs dotenv-cli because tsx does not read
 * .env.local on its own — only Next does.
 */
import { seedMovements, SEED_FARM_ID } from '../lib/seed'
import { appendMovements, movementsForFarm } from '../lib/storage/movements'

async function main() {
  const before = await movementsForFarm(SEED_FARM_ID)
  const movements = seedMovements(new Date())

  await appendMovements(movements)

  const after = await movementsForFarm(SEED_FARM_ID)
  console.log(
    `seed: ${movements.length} offered · ${before.length} already there · ${after.length} now stored`,
  )

  if (after.length === before.length && before.length > 0) {
    console.log('nothing written — ids already present, which is the append-only guarantee working')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
