'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/current-user'
import { createFarm as createFarmRecord, getFarm } from '@/lib/storage/farms'
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
  id: string,
  name: string,
  tagline?: string,
  market?: string,
) {
  await requireAdmin()

  // Check if farm already exists
  const existing = await getFarm(id)
  if (existing) {
    throw new Error(`Farm with id ${id} already exists`)
  }

  await createFarmRecord(id, name, tagline, market)
  revalidatePath('/admin')
}
