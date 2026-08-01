import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getUserRecord } from '../storage/users'

/**
 * The session's identity and authorization.
 *
 * A `farmer` can only see their own farm. An `admin` sees all farms.
 * A `pending` user is signed in via Clerk but not yet assigned to a farm.
 */
export type SessionUser =
  | { role: 'admin'; clerkId: string }
  | { role: 'farmer'; clerkId: string; farmId: string }
  | { role: 'pending'; clerkId: string }

/** Get the current user's session and role. Returns null if not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await getUserRecord(userId)
  if (!user) {
    // Signed in via Clerk but not yet in our users table — treat as pending.
    return { role: 'pending', clerkId: userId }
  }

  if (user.role === 'admin') {
    return { role: 'admin', clerkId: userId }
  }

  if (user.role === 'farmer') {
    if (!user.farmId) {
      // Farmer with no farm assignment yet.
      return { role: 'pending', clerkId: userId }
    }
    return { role: 'farmer', clerkId: userId, farmId: user.farmId }
  }

  // Shouldn't happen, but treat as pending to be safe.
  return { role: 'pending', clerkId: userId }
}

/**
 * Require a user to have access to a specific farm.
 *
 * Admin can access any farm. Farmer can only access their own.
 * Redirects to sign-in if not authenticated; notFound() if farm is not accessible.
 */
export async function requireFarmAccess(farmId: string): Promise<void> {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    // Admin can access any farm
    return
  }

  if (user.role === 'farmer' && user.farmId === farmId) {
    // Farmer can access their own farm
    return
  }

  // Pending, or farmer accessing a different farm
  if (user.role === 'pending') {
    redirect('/onboarding')
  }

  // Farmer accessing a farm that isn't theirs
  const { notFound } = await import('next/navigation')
  notFound()
}

/**
 * Require the user to be an admin.
 *
 * Redirects to sign-in if not authenticated; notFound() if not an admin.
 */
export async function requireAdmin(): Promise<void> {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    return
  }

  const { notFound } = await import('next/navigation')
  notFound()
}

/**
 * Check farm access in a Route Handler (can't call redirect).
 *
 * Returns { ok: true } if access is granted, { ok: false, status } otherwise.
 */
export async function checkFarmAccess(
  farmId: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const user = await getSessionUser()

  if (!user) {
    return { ok: false, status: 401 }
  }

  if (user.role === 'admin') {
    return { ok: true }
  }

  if (user.role === 'farmer' && user.farmId === farmId) {
    return { ok: true }
  }

  return { ok: false, status: 403 }
}
