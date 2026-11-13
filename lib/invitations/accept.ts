import { markAccepted, openInvitationsForEmail } from '../storage/invitations'
import { createUserIfAbsent, getUserRecord, upsertUser } from '../storage/users'
import type { UserRow } from '../db/schema'
import { invitationToAccept, normaliseEmail } from './index'

/**
 * Take up the invitation waiting for a person who has just signed in.
 *
 * Called with an email Clerk has **verified** — that is the whole check that the
 * person at the keyboard owns the address an admin vouched for, so nothing
 * unverified may reach here. Returns the person's `users` row, or null when
 * nobody asked them in (they stay pending).
 *
 * The user row is written before the invitation is marked accepted, so a crash
 * between the two leaves an invitation that is still open and harmless — the
 * next sign-in finds the row already there and finishes the job — rather than
 * one that is spent with nobody let in.
 */
export async function acceptInvitationFor(
  clerkId: string,
  verifiedEmail: string,
): Promise<UserRow | null> {
  const email = normaliseEmail(verifiedEmail)
  const invitation = invitationToAccept(await openInvitationsForEmail(email), email)
  if (!invitation) return null

  const role = invitation.role === 'admin' ? 'admin' : 'farmer'

  if (await getUserRecord(clerkId)) {
    // A signed-up farmer who was never assigned — the invitation assigns them.
    await upsertUser(clerkId, role, email, invitation.farmId)
  } else {
    await createUserIfAbsent({ clerkId, role, email, farmId: invitation.farmId })
  }

  await markAccepted(invitation.id, new Date())
  return getUserRecord(clerkId)
}
