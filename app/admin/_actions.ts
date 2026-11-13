'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/current-user'
import { isValidSlug, toSlug } from '@/lib/farms'
import { createFarm as createFarmRecord, getFarm, getFarmBySlug } from '@/lib/storage/farms'
import { assignFarmerToFarm as assignFarmerRecord } from '@/lib/storage/users'

export async function assignFarmerToFarm(userId: string, farmId: string) {
  await requireAdmin()

  // Verify farm exists
  const farm = await getFarm(farmId)
  if (!farm) {
    throw new Error(`Farm ${farmId} not found`)
  }

  await assignFarmerRecord(userId, farmId)
  revalidatePath('/admin')
}

export async function createFarm(
  slugInput: string,
  name: string,
  tagline?: string,
  market?: string,
) {
  await requireAdmin()

  // The farm ID is generated; what the admin types is the public URL.
  const slug = isValidSlug(slugInput) ? slugInput : toSlug(slugInput || name)
  if (!slug) {
    throw new Error(`"${slugInput}" can't be made into a farm stand URL`)
  }

  if (await getFarmBySlug(slug)) {
    throw new Error(`A farm already uses the URL /f/${slug}`)
  }

  await createFarmRecord({ name, slug, tagline, market })
  revalidatePath('/admin')
}
