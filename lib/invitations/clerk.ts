import { clerkClient } from '@clerk/nextjs/server'

/**
 * Clerk's side of an invitation — the only place that talks to it.
 *
 * Clerk sends the email itself, so the beta needs no email service. It cannot
 * re-send one, though: a "resend" is the old invitation revoked and a new one
 * created, which is why an invitation row's Clerk id changes.
 */

export type SentInvitation = {
  id: string
  /** Clerk's sign-up link — what an admin can send by hand if the email never arrives. */
  url: string | null
}

export async function sendClerkInvitation(args: {
  email: string
  /** Our `invitations.id`, carried in the invitation's public metadata. */
  invitationId: string
  redirectUrl: string
}): Promise<SentInvitation> {
  const client = await clerkClient()
  const invitation = await client.invitations.createInvitation({
    emailAddress: args.email,
    redirectUrl: args.redirectUrl,
    publicMetadata: { invitationId: args.invitationId },
  })
  return { id: invitation.id, url: invitation.url ?? null }
}

export async function revokeClerkInvitation(clerkInvitationId: string): Promise<void> {
  const client = await clerkClient()
  await client.invitations.revokeInvitation(clerkInvitationId)
}
