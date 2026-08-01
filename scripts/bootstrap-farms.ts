/**
 * Seed the farms table with the seed farm.
 *
 * Run this after `pnpm db:push` to populate the one farm the pilot uses.
 * All existing movements/messages already reference 'seed-farm' so this closes
 * the FK constraint loop.
 */
import { getDb } from '../lib/db'
import { farms } from '../lib/db/schema'
import { SEED_FARM } from '../lib/seed'

async function main() {
  const db = getDb()

  // Upsert the seed farm. If it already exists, this is a no-op.
  await db
    .insert(farms)
    .values({
      id: SEED_FARM.id,
      name: SEED_FARM.name,
      tagline: SEED_FARM.tagline,
      market: SEED_FARM.market,
      logo: SEED_FARM.logo,
      createdAt: new Date(),
    })
    .onConflictDoNothing()

  console.log(`✓ Seeded farm: ${SEED_FARM.id}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
