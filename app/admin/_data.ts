import { buildPeople, summarisePeople } from '@/lib/admin'
import { listClerkAccounts } from '@/lib/admin/clerk-accounts'
import { listAllInvitations, listAllUsers, postingByPerson } from '@/lib/storage/admin'

/**
 * Everyone, merged from Clerk, `users` and `invitations` — shared by the
 * overview and the people page. Callers check for an admin first.
 */
export async function loadPeople(now: Date) {
  const [accounts, users, invitations, posting] = await Promise.all([
    listClerkAccounts(),
    listAllUsers(),
    listAllInvitations(),
    postingByPerson(),
  ])
  const people = buildPeople({ accounts, users, invitations, posting })
  return {
    people,
    summary: summarisePeople(people, invitations, now),
    clerkReachable: accounts !== null,
    /** Clerk id → email, for "invited by". */
    emailById: new Map(people.flatMap((p) => (p.clerkId && p.email ? [[p.clerkId, p.email]] : []))),
  }
}
