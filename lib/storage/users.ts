import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { users, type UserRow } from '../db/schema'

/**
 * Get a user record by Clerk ID.
 *
 * Returns the user's role and farm assignment, if any.
 */
export async function getUserRecord(clerkId: string): Promise<UserRow | null> {
  const result = await getDb().select().from(users).where(eq(users.id, clerkId))
  return result[0] ?? null
}

/**
 * Create or update a user record.
 *
 * Called once when a Clerk user first signs in (via a webhook, or manually via make-admin script).
 */
export async function upsertUser(
  clerkId: string,
  role: 'farmer' | 'admin',
  email?: string,
  farmId?: string,
): Promise<UserRow> {
  const db = getDb()

  const existing = await getUserRecord(clerkId)
  if (existing) {
    // Update
    await db
      .update(users)
      .set({ role, email, farmId: farmId || null })
      .where(eq(users.id, clerkId))
    return (await getUserRecord(clerkId))!
  }

  // Insert
  await db.insert(users).values({
    id: clerkId,
    role,
    email,
    farmId: farmId || null,
    createdAt: new Date(),
  })

  return (await getUserRecord(clerkId))!
}

/**
 * Assign a farmer to a farm.
 *
 * Called from the admin page when assigning a pending user.
 */
export async function assignFarmerToFarm(clerkId: string, farmId: string): Promise<void> {
  await getDb().update(users).set({ farmId }).where(eq(users.id, clerkId))
}

/**
 * List all users with a given role.
 */
export async function listUsersByRole(role: 'farmer' | 'admin'): Promise<UserRow[]> {
  return getDb().select().from(users).where(eq(users.role, role))
}

/**
 * List all pending users (signed in but not assigned to a farm).
 */
export async function listPendingUsers(): Promise<UserRow[]> {
  const db = getDb()
  // Pending = farmer with no farmId
  const result = await db
    .selectDistinct()
    .from(users)
    .where(eq(users.role, 'farmer'))

  return result.filter((u) => !u.farmId)
}
