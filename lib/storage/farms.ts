import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { farms, type FarmRow } from '../db/schema'

/**
 * Get a farm by ID.
 *
 * Returns null if the farm doesn't exist.
 */
export async function getFarm(farmId: string): Promise<FarmRow | null> {
  const result = await getDb().select().from(farms).where(eq(farms.id, farmId))
  return result[0] ?? null
}

/**
 * List all farms.
 *
 * Used by the admin page to show all available farms.
 */
export async function listFarms(): Promise<FarmRow[]> {
  return getDb().select().from(farms)
}

/**
 * Create a new farm.
 *
 * Called from the admin page when adding a new farm.
 * `id` should be a human-readable slug (e.g. 'my-farm', 'seed-farm').
 */
export async function createFarm(
  id: string,
  name: string,
  tagline?: string,
  market?: string,
  logo?: string,
): Promise<FarmRow> {
  await getDb().insert(farms).values({
    id,
    name,
    tagline,
    market,
    logo,
    createdAt: new Date(),
  })

  return (await getFarm(id))!
}
