import { and, desc, eq, isNull } from 'drizzle-orm'
import { getDb } from '../db'
import { invitations, type InvitationRow, type NewInvitationRow } from '../db/schema'

export async function getInvitation(id: string): Promise<InvitationRow | null> {
  const result = await getDb().select().from(invitations).where(eq(invitations.id, id))
  return result[0] ?? null
}

export async function insertInvitation(row: NewInvitationRow): Promise<void> {
  await getDb().insert(invitations).values(row)
}

/** Used when Clerk refused to send: nothing went out, so nothing should be on record. */
export async function deleteInvitation(id: string): Promise<void> {
  await getDb().delete(invitations).where(eq(invitations.id, id))
}

/** Everything ever sent to a farm's people, newest first — open and not. */
export async function invitationsForFarm(farmId: string): Promise<InvitationRow[]> {
  return getDb()
    .select()
    .from(invitations)
    .where(eq(invitations.farmId, farmId))
    .orderBy(desc(invitations.invitedAt))
}

/** Open invitations for one (already normalised) email. */
export async function openInvitationsForEmail(email: string): Promise<InvitationRow[]> {
  return getDb()
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.email, email),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    )
}

/** A resend is a new Clerk invitation under the same row. */
export async function setClerkInvitation(
  id: string,
  clerkInvitationId: string,
  url: string | null,
): Promise<void> {
  await getDb()
    .update(invitations)
    .set({ clerkInvitationId, url })
    .where(eq(invitations.id, id))
}

/** Idempotent: two first page loads racing both land here, and neither is wrong. */
export async function markAccepted(id: string, at: Date): Promise<void> {
  await getDb()
    .update(invitations)
    .set({ acceptedAt: at })
    .where(and(eq(invitations.id, id), isNull(invitations.acceptedAt)))
}

export async function markRevoked(id: string, at: Date): Promise<void> {
  await getDb()
    .update(invitations)
    .set({ revokedAt: at })
    .where(and(eq(invitations.id, id), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
}
