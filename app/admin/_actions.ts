'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/current-user'
import { isValidSlug, toSlug } from '@/lib/farms'
import {
  isValidEmail,
  invitationState,
  normaliseEmail,
  type InvitationRole,
} from '@/lib/invitations'
import { revokeClerkInvitation, sendClerkInvitation } from '@/lib/invitations/clerk'
import {
  createFarm as createFarmRecord,
  getFarm,
  getFarmByDirectoryProfileId,
  getFarmBySlug,
} from '@/lib/storage/farms'
import {
  deleteInvitation,
  getInvitation,
  insertInvitation,
  markRevoked,
  openInvitationsForEmail,
  setClerkInvitation,
} from '@/lib/storage/invitations'
import { assignFarmerToFarm as assignFarmerRecord, getUserByEmail } from '@/lib/storage/users'

/**
 * Every export here starts by asking who is signed in — Server Actions are not
 * covered by the proxy, and anyone can POST to one. A test fails for an export
 * that doesn't.
 *
 * Expected refusals come back as `{ ok: false, error }` for the form to show.
 * Only the unexpected throws.
 */
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string }

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

export type NewFarmInput = {
  name: string
  slug: string
  /** Blank when the farm isn't in the directory yet. */
  directoryProfileId?: string
  kyfVerified?: boolean
  tagline?: string
  market?: string
}

export async function createFarm(input: NewFarmInput): Promise<ActionResult<{ farmId: string }>> {
  await requireAdmin()

  const name = input.name.trim()
  if (!name) return { ok: false, error: 'A farm needs a name.' }

  // The farm ID is generated; what the admin types is the public URL.
  const typed = input.slug.trim()
  const slug = isValidSlug(typed) ? typed : toSlug(typed || name)
  if (!slug) return { ok: false, error: `"${typed}" can't be made into a farm stand URL.` }

  if (await getFarmBySlug(slug)) {
    return { ok: false, error: `A farm already uses the URL /f/${slug}.` }
  }

  const directoryProfileId = input.directoryProfileId?.trim() || undefined
  if (directoryProfileId && (await getFarmByDirectoryProfileId(directoryProfileId))) {
    return { ok: false, error: `Another farm already has directory profile ${directoryProfileId}.` }
  }

  const farm = await createFarmRecord({
    name,
    slug,
    directoryProfileId,
    kyfVerified: input.kyfVerified ?? false,
    tagline: input.tagline?.trim() || undefined,
    market: input.market?.trim() || undefined,
  })
  revalidatePath('/admin')
  return { ok: true, farmId: farm.id }
}

export type InviteInput = {
  farmId: string
  email: string
  role: InvitationRole
  /** "This email matches their MABFC member record" — the admin vouching. */
  attested: boolean
}

/**
 * Invite someone to a farm: our row first, then Clerk's email.
 *
 * If Clerk refuses, the row goes too — an invitation nobody was sent shouldn't
 * sit in the list looking like one that is waiting.
 */
export async function inviteToFarm(input: InviteInput): Promise<ActionResult> {
  const admin = await requireAdmin()

  const email = normaliseEmail(input.email)
  if (!isValidEmail(email)) return { ok: false, error: `"${input.email}" isn't an email address.` }
  if (input.role !== 'farmer' && input.role !== 'admin') {
    return { ok: false, error: 'Pick farmer or admin.' }
  }
  if (!input.attested) {
    return {
      ok: false,
      error: "Confirm the email matches this person's MABFC member record first.",
    }
  }

  const farm = await getFarm(input.farmId)
  if (!farm) return { ok: false, error: 'That farm no longer exists.' }

  if (await getUserByEmail(email)) {
    return { ok: false, error: `${email} already has an account.` }
  }
  if ((await openInvitationsForEmail(email)).length > 0) {
    return { ok: false, error: `${email} has already been invited. Resend or revoke that one.` }
  }

  const now = new Date()
  const id = crypto.randomUUID()
  await insertInvitation({
    id,
    email,
    farmId: farm.id,
    role: input.role,
    invitedBy: admin.clerkId,
    invitedAt: now,
    attestedBy: admin.clerkId,
    attestedAt: now,
  })

  try {
    const sent = await sendClerkInvitation({
      email,
      invitationId: id,
      redirectUrl: await signUpUrl(),
    })
    await setClerkInvitation(id, sent.id, sent.url)
  } catch (error) {
    await deleteInvitation(id)
    return { ok: false, error: `Clerk wouldn't send it: ${describe(error)}` }
  }

  revalidatePath(`/admin/farms/${farm.id}`)
  return { ok: true }
}

/** Clerk can't re-send, so this revokes the old invitation and sends a fresh one. */
export async function resendInvitation(invitationId: string): Promise<ActionResult> {
  await requireAdmin()

  const invitation = await getInvitation(invitationId)
  if (!invitation) return { ok: false, error: 'That invitation no longer exists.' }
  if (invitationState(invitation) !== 'open') {
    return { ok: false, error: `That invitation is already ${invitationState(invitation)}.` }
  }

  try {
    if (invitation.clerkInvitationId) await revokeClerkInvitation(invitation.clerkInvitationId)
  } catch {
    // Already revoked or expired on Clerk's side — which is what we wanted anyway.
  }

  try {
    const sent = await sendClerkInvitation({
      email: invitation.email,
      invitationId: invitation.id,
      redirectUrl: await signUpUrl(),
    })
    await setClerkInvitation(invitation.id, sent.id, sent.url)
  } catch (error) {
    return { ok: false, error: `Clerk wouldn't send it: ${describe(error)}` }
  }

  revalidatePath(`/admin/farms/${invitation.farmId}`)
  return { ok: true }
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  await requireAdmin()

  const invitation = await getInvitation(invitationId)
  if (!invitation) return { ok: false, error: 'That invitation no longer exists.' }
  if (invitationState(invitation) !== 'open') {
    return { ok: false, error: `That invitation is already ${invitationState(invitation)}.` }
  }

  try {
    if (invitation.clerkInvitationId) await revokeClerkInvitation(invitation.clerkInvitationId)
  } catch (error) {
    return { ok: false, error: `Clerk wouldn't revoke it: ${describe(error)}` }
  }

  await markRevoked(invitation.id, new Date())
  revalidatePath(`/admin/farms/${invitation.farmId}`)
  return { ok: true }
}

/**
 * Where an accepted invitation lands: our own sign-up page. `PUBLIC_BASE_URL`
 * when it's set (so staging links point at staging), otherwise the host this
 * request came in on.
 */
async function signUpUrl(): Promise<string> {
  const configured = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '')
  if (configured) return `${configured}/sign-up`

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}/sign-up`
}

/** Clerk errors carry the useful sentence a layer down. */
function describe(error: unknown): string {
  const clerk = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0]
  if (clerk) return clerk.longMessage ?? clerk.message ?? 'unknown error'
  return error instanceof Error ? error.message : 'unknown error'
}
