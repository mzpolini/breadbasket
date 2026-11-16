import { clerkClient } from '@clerk/nextjs/server'
import type { ClerkAccount } from '.'

/** Pages of 500 (Clerk's maximum); ten covers any pilot several times over. */
const PAGE = 500
const MAX_PAGES = 10

/**
 * Every Clerk account, with its sign-in times — the only place "who has logged
 * in, and when" is recorded. A handful of paged calls per render, never one per
 * person.
 *
 * Null when Clerk can't be reached: the panel says so and shows what our own
 * tables know, rather than failing the page.
 */
export async function listClerkAccounts(): Promise<ClerkAccount[] | null> {
  try {
    const client = await clerkClient()
    const accounts: ClerkAccount[] = []
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, totalCount } = await client.users.getUserList({
        limit: PAGE,
        offset: page * PAGE,
        orderBy: '-created_at',
      })
      for (const user of data) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
        accounts.push({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
          name: name || null,
          createdAt: new Date(user.createdAt),
          lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : null,
          lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : null,
        })
      }
      if (data.length < PAGE || accounts.length >= totalCount) break
    }
    return accounts
  } catch (error) {
    console.error('could not list Clerk accounts', error)
    return null
  }
}
