import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm'
import { getDb } from '../db'
import { farms, type FarmRow } from '../db/schema'
import { newFarmId } from '../farms'

/**
 * Get a farm by its Breadbasket farm ID.
 *
 * Returns null if the farm doesn't exist.
 */
export async function getFarm(farmId: string): Promise<FarmRow | null> {
  const result = await getDb().select().from(farms).where(eq(farms.id, farmId))
  return result[0] ?? null
}

/** Get a farm by its public slug — what `/f/<slug>` resolves. */
export async function getFarmBySlug(slug: string): Promise<FarmRow | null> {
  const result = await getDb().select().from(farms).where(eq(farms.slug, slug))
  return result[0] ?? null
}

/** Get a farm by its MABFC directory profile — to refuse a second farm claiming one. */
export async function getFarmByDirectoryProfileId(profileId: string): Promise<FarmRow | null> {
  const result = await getDb().select().from(farms).where(eq(farms.directoryProfileId, profileId))
  return result[0] ?? null
}

/**
 * The farms the read API may report: KYF-verified **and** mapped to a directory
 * profile. A farm that is neither is not in the API at all — and the API answers
 * for one exactly as it does for a farm that doesn't exist, so it can't be used
 * to find out which farms are on the platform.
 *
 * `ids` narrows it; unknown or unmapped ones simply aren't returned.
 */
export async function mappedFarms(ids?: string[]): Promise<FarmRow[]> {
  if (ids && ids.length === 0) return []
  return getDb()
    .select()
    .from(farms)
    .where(
      and(
        eq(farms.kyfVerified, true),
        isNotNull(farms.directoryProfileId),
        ids ? inArray(farms.id, ids) : undefined,
      ),
    )
    .orderBy(asc(farms.id))
}

/**
 * List all farms.
 *
 * Used by the admin page to show all available farms.
 */
export async function listFarms(): Promise<FarmRow[]> {
  return getDb().select().from(farms)
}

export type NewFarm = {
  name: string
  /** Already validated with `isValidSlug`. */
  slug: string
  directoryProfileId?: string
  kyfVerified?: boolean
  tagline?: string
  market?: string
  logo?: string
}

/**
 * Create a new farm.
 *
 * The farm ID is generated here and never changes — it is what the MABFC
 * directory joins on. The public URL is the slug, which can be edited later.
 */
export async function createFarm(farm: NewFarm): Promise<FarmRow> {
  const id = newFarmId()
  await getDb()
    .insert(farms)
    .values({
      id,
      name: farm.name,
      slug: farm.slug,
      directoryProfileId: farm.directoryProfileId ?? null,
      kyfVerified: farm.kyfVerified ?? false,
      tagline: farm.tagline,
      market: farm.market,
      logo: farm.logo,
      createdAt: new Date(),
    })

  return (await getFarm(id))!
}
