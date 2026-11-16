/**
 * The admin panel's numbers, as pure functions — no database, no Clerk.
 *
 * Three sources describe a person and none of them alone is the whole story:
 * Clerk knows who has an account and when they last signed in; `users` knows
 * their role and farm; `invitations` knows who was asked in. The panel merges
 * them on the Clerk id and the (normalised) email, here, so the merge can be
 * tested with fixture rows.
 */

import { invitationState, normaliseEmail, type InvitationState } from '../invitations'

/** The pilot is in Maryland; days are counted there, not in UTC. */
export const ADMIN_TIME_ZONE = 'America/New_York'

export type ClerkAccount = {
  id: string
  email: string | null
  name: string | null
  createdAt: Date
  lastSignInAt: Date | null
  lastActiveAt: Date | null
}

export type UserFacts = {
  id: string
  role: string
  farmId: string | null
  email: string | null
  createdAt: Date
}

export type InvitationRowFacts = {
  id: string
  email: string
  farmId: string
  role: string
  invitedBy: string
  invitedAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
}

export type PostingFacts = {
  postedBy: string
  lastPostedAt: Date
  messages: number
}

/**
 * - `admin` / `farmer` — in, with a role (a farmer with a farm).
 * - `pending` — a farmer row with no farm yet.
 * - `uninvited` — a Clerk account nobody asked in: no `users` row at all.
 * - `invited` — asked in, hasn't made an account yet.
 * - `revoked` — asked in, then un-asked, and never made an account.
 */
export type PersonStatus = 'admin' | 'farmer' | 'pending' | 'uninvited' | 'invited' | 'revoked'

export type PersonRow = {
  /** Clerk id when there is one, otherwise the invitation id. */
  key: string
  clerkId: string | null
  email: string | null
  name: string | null
  status: PersonStatus
  farmId: string | null
  invitation: {
    id: string
    state: InvitationState
    invitedAt: Date
    invitedBy: string
    role: string
    farmId: string
  } | null
  /** When their account was made — Clerk's clock, else our `users` row. */
  firstSeenAt: Date | null
  lastSignInAt: Date | null
  lastActiveAt: Date | null
  lastPostedAt: Date | null
  messages: number
}

/** Newest invitation for each email. */
function newestInvitationByEmail(invitations: InvitationRowFacts[]) {
  const byEmail = new Map<string, InvitationRowFacts>()
  for (const inv of invitations) {
    const key = normaliseEmail(inv.email)
    const seen = byEmail.get(key)
    if (!seen || seen.invitedAt < inv.invitedAt) byEmail.set(key, inv)
  }
  return byEmail
}

function statusOf(user: UserFacts | undefined): PersonStatus {
  if (!user) return 'uninvited'
  if (user.role === 'admin') return 'admin'
  return user.farmId ? 'farmer' : 'pending'
}

/**
 * One row per person: everyone with a Clerk account or a `users` row, plus
 * everyone invited who hasn't made an account yet.
 *
 * `accounts` is null when Clerk couldn't be reached — the table still shows
 * what our own tables know, without sign-in times.
 */
export function buildPeople(args: {
  accounts: ClerkAccount[] | null
  users: UserFacts[]
  invitations: InvitationRowFacts[]
  posting: PostingFacts[]
}): PersonRow[] {
  const usersById = new Map(args.users.map((u) => [u.id, u]))
  const postingById = new Map(args.posting.map((p) => [p.postedBy, p]))
  const invitationsByEmail = newestInvitationByEmail(args.invitations)
  const claimedEmails = new Set<string>()
  const rows: PersonRow[] = []

  const toInvitation = (inv: InvitationRowFacts | undefined): PersonRow['invitation'] =>
    inv
      ? {
          id: inv.id,
          state: invitationState(inv),
          invitedAt: inv.invitedAt,
          invitedBy: inv.invitedBy,
          role: inv.role,
          farmId: inv.farmId,
        }
      : null

  const person = (
    clerkId: string,
    account: ClerkAccount | undefined,
    user: UserFacts | undefined,
  ): PersonRow => {
    const email = account?.email ?? user?.email ?? null
    const emailKey = email ? normaliseEmail(email) : null
    if (emailKey) claimedEmails.add(emailKey)
    const posting = postingById.get(clerkId)
    return {
      key: clerkId,
      clerkId,
      email,
      name: account?.name ?? null,
      status: statusOf(user),
      farmId: user?.farmId ?? null,
      invitation: toInvitation(emailKey ? invitationsByEmail.get(emailKey) : undefined),
      firstSeenAt: account?.createdAt ?? user?.createdAt ?? null,
      lastSignInAt: account?.lastSignInAt ?? null,
      lastActiveAt: account?.lastActiveAt ?? null,
      lastPostedAt: posting?.lastPostedAt ?? null,
      messages: posting?.messages ?? 0,
    }
  }

  const seen = new Set<string>()
  for (const account of args.accounts ?? []) {
    seen.add(account.id)
    rows.push(person(account.id, account, usersById.get(account.id)))
  }
  // A `users` row Clerk didn't return: Clerk was unreachable, or the account was
  // deleted there. Still a person on a farm, as far as we're concerned.
  for (const user of args.users) {
    if (seen.has(user.id)) continue
    rows.push(person(user.id, undefined, user))
  }
  // Asked in, no account yet.
  for (const [emailKey, inv] of invitationsByEmail) {
    if (claimedEmails.has(emailKey)) continue
    const state = invitationState(inv)
    rows.push({
      key: inv.id,
      clerkId: null,
      email: inv.email,
      name: null,
      // An accepted invitation always has an account behind it; if Clerk didn't
      // return one it was deleted, which reads most honestly as "invited".
      status: state === 'revoked' ? 'revoked' : 'invited',
      farmId: inv.farmId,
      invitation: toInvitation(inv),
      firstSeenAt: null,
      lastSignInAt: null,
      lastActiveAt: null,
      lastPostedAt: null,
      messages: 0,
    })
  }

  return rows.sort((a, b) => lastSeen(b) - lastSeen(a))
}

/** The most recent sign of life, for sorting: activity, then sign-in, then invitation. */
export function lastSeen(row: PersonRow): number {
  const times = [row.lastActiveAt, row.lastSignInAt, row.lastPostedAt, row.firstSeenAt, row.invitation?.invitedAt]
  return Math.max(0, ...times.filter((t): t is Date => t !== null && t !== undefined).map((t) => t.getTime()))
}

const DAY = 24 * 60 * 60 * 1000

/** Active = Clerk saw them, or they posted, inside the window. */
export function wasActiveWithin(row: PersonRow, ms: number, now: Date): boolean {
  const cutoff = now.getTime() - ms
  return [row.lastActiveAt, row.lastSignInAt, row.lastPostedAt].some(
    (t) => t !== null && t.getTime() >= cutoff,
  )
}

export type PeopleSummary = {
  /** People with an account — Clerk's count when we have it. */
  accounts: number
  signedIn: number
  active24h: number
  active7d: number
  posted: number
  waiting: number
  invitations: { open: number; accepted: number; revoked: number }
}

export function summarisePeople(
  rows: PersonRow[],
  invitations: InvitationRowFacts[],
  now: Date,
): PeopleSummary {
  const withAccount = rows.filter((r) => r.clerkId !== null)
  const invitationCounts = { open: 0, accepted: 0, revoked: 0 }
  for (const inv of invitations) invitationCounts[invitationState(inv)]++
  return {
    accounts: withAccount.length,
    signedIn: withAccount.filter((r) => r.lastSignInAt !== null || r.messages > 0).length,
    active24h: withAccount.filter((r) => wasActiveWithin(r, DAY, now)).length,
    active7d: withAccount.filter((r) => wasActiveWithin(r, 7 * DAY, now)).length,
    posted: withAccount.filter((r) => r.messages > 0).length,
    waiting: rows.filter((r) => r.status === 'pending' || r.status === 'uninvited').length,
    invitations: invitationCounts,
  }
}

/** `YYYY-MM-DD` for an instant, in the admin time zone. */
export function dayKey(date: Date, timeZone = ADMIN_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export type DayCount = { day: string; messages: number; people: number }

/**
 * The last `days` days ending today, oldest first, with a zero for every day
 * nothing happened — a gap in a bar chart should read as a quiet day, not be
 * squeezed out of the axis.
 */
export function fillDays(counts: DayCount[], days: number, now: Date): DayCount[] {
  const byDay = new Map(counts.map((c) => [c.day, c]))
  const keys: string[] = []
  // Stepping back 24h at a time can land on the same local day twice, or skip
  // one, across a DST change; overshoot by a day and dedupe.
  for (let i = days; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * DAY))
    if (!keys.includes(key)) keys.push(key)
  }
  return keys.slice(-days).map((day) => byDay.get(day) ?? { day, messages: 0, people: 0 })
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then a date. */
export function timeAgo(date: Date | null, now: Date): string {
  if (!date) return '—'
  const ms = now.getTime() - date.getTime()
  if (ms < 60 * 1000) return 'just now'
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.floor(h / 24)
  if (d < 14) return `${d} d ago`
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ADMIN_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  }).format(date)
}

/** Full timestamp for a tooltip. */
export function fullTime(date: Date | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ADMIN_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
