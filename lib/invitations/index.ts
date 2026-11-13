/**
 * Invitations, as pure rules — no database, no Clerk.
 *
 * What an invitation *is* (open, accepted, revoked) and which one a signing-in
 * person gets matched to. Kept apart from storage so the matching can be tested
 * without either.
 */

export type InvitationRole = 'farmer' | 'admin'

export type InvitationFacts = {
  email: string
  invitedAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
}

export type InvitationState = 'open' | 'accepted' | 'revoked'

/** Emails are matched case-insensitively, so they are stored one way. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** A shape check, not a deliverability one — Clerk is the one that sends. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Accepted wins over revoked: someone who got in stays in. */
export function invitationState(invitation: InvitationFacts): InvitationState {
  if (invitation.acceptedAt) return 'accepted'
  if (invitation.revokedAt) return 'revoked'
  return 'open'
}

/**
 * The invitation a signing-in person takes up: an open one for their email, and
 * the newest if there are several (a farm was re-invited, or two farms asked).
 * Null when nobody asked them in.
 */
export function invitationToAccept<T extends InvitationFacts>(
  invitations: T[],
  email: string,
): T | null {
  const wanted = normaliseEmail(email)
  const open = invitations
    .filter((i) => normaliseEmail(i.email) === wanted && invitationState(i) === 'open')
    .sort((a, b) => b.invitedAt.getTime() - a.invitedAt.getTime())
  return open[0] ?? null
}
