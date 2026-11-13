import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { acceptInvitationFor } from '../invitations/accept'
import type { UserRow } from '../db/schema'
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

/** A signed-in admin — what `requireAdmin` hands back, so a write can say who did it. */
export type AdminActor = Extract<SessionUser, { role: 'admin' }>

/** A signed-in user who may act on a farm. */
export type FarmActor = Extract<SessionUser, { role: 'admin' | 'farmer' }>

/** Get the current user's session and role. Returns null if not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  let user = await getUserRecord(userId)

  // Nobody is let in by signing up — only by being invited. The first time an
  // invited person lands here (no row yet, or a farmer never given a farm), their
  // verified email is matched to an open invitation and that creates their row.
  if (!user || (user.role === 'farmer' && !user.farmId)) {
    user = (await takeUpInvitation(userId)) ?? user
  }

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
 * The invitation, if any, for the person who just signed in.
 *
 * Only a **verified** primary email counts. A failure to reach Clerk is not a
 * reason to break the page: the person stays pending and the next request tries
 * again.
 */
async function takeUpInvitation(clerkId: string): Promise<UserRow | null> {
  try {
    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress
    if (!email || email.verification?.status !== 'verified') return null
    return await acceptInvitationFor(clerkId, email.emailAddress)
  } catch (error) {
    console.error('could not check for an invitation', error)
    return null
  }
}

/**
 * Require a user to have access to a specific farm.
 *
 * Admin can access any farm. Farmer can only access their own.
 * Redirects to sign-in if not authenticated; notFound() if farm is not accessible.
 *
 * Returns the user, so a write can be attributed to whoever is signed in —
 * never to an id the client sent.
 */
export async function requireFarmAccess(farmId: string): Promise<FarmActor> {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    // Admin can access any farm
    return user
  }

  if (user.role === 'farmer' && user.farmId === farmId) {
    // Farmer can access their own farm
    return user
  }

  // Pending, or farmer accessing a different farm
  if (user.role === 'pending') {
    redirect('/onboarding')
  }

  // Farmer accessing a farm that isn't theirs
  const { notFound } = await import('next/navigation')
  return notFound()
}

/**
 * Require the user to be an admin.
 *
 * Redirects to sign-in if not authenticated; notFound() if not an admin.
 *
 * Returns the admin, so a write can be attributed to whoever is signed in.
 */
export async function requireAdmin(): Promise<AdminActor> {
  const user = await getSessionUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (user.role === 'admin') {
    return user
  }

  const { notFound } = await import('next/navigation')
  return notFound()
}

/**
 * Check farm access in a Route Handler (can't call redirect).
 *
 * Returns { ok: true, user } if access is granted, { ok: false, status } otherwise.
 */
export async function checkFarmAccess(
  farmId: string,
): Promise<{ ok: true; user: FarmActor } | { ok: false; status: number }> {
  const user = await getSessionUser()

  if (!user) {
    return { ok: false, status: 401 }
  }

  if (user.role === 'admin') {
    return { ok: true, user }
  }

  if (user.role === 'farmer' && user.farmId === farmId) {
    return { ok: true, user }
  }

  return { ok: false, status: 403 }
}
