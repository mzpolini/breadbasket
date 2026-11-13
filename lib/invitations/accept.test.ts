import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InvitationRow, UserRow } from '../db/schema'

/**
 * Accepting an invitation: a verified email, matched to an open invitation,
 * becomes a `users` row on the invitation's farm. Storage is faked in memory so
 * what is under test is the decision, not the SQL.
 */

const state = vi.hoisted(() => ({
  invitations: [] as InvitationRow[],
  users: new Map<string, UserRow>(),
}))

vi.mock('../storage/invitations', () => ({
  openInvitationsForEmail: async (email: string) =>
    state.invitations.filter((i) => i.email === email && !i.acceptedAt && !i.revokedAt),
  markAccepted: async (id: string, at: Date) => {
    const row = state.invitations.find((i) => i.id === id)
    if (row && !row.acceptedAt) row.acceptedAt = at
  },
}))

vi.mock('../storage/users', () => ({
  getUserRecord: async (id: string) => state.users.get(id) ?? null,
  createUserIfAbsent: async (u: { clerkId: string; role: string; email: string; farmId: string }) => {
    if (state.users.has(u.clerkId)) return
    state.users.set(u.clerkId, {
      id: u.clerkId,
      role: u.role,
      email: u.email,
      farmId: u.farmId,
      createdAt: new Date(),
    })
  },
  upsertUser: async (id: string, role: string, email?: string, farmId?: string) => {
    state.users.set(id, { id, role, email: email ?? null, farmId: farmId ?? null, createdAt: new Date() })
    return state.users.get(id)!
  },
}))

import { acceptInvitationFor } from './accept'

const invitation = (over: Partial<InvitationRow> = {}): InvitationRow => ({
  id: 'inv-1',
  email: 'alice@farm.test',
  farmId: 'farm_a',
  role: 'farmer',
  clerkInvitationId: 'cinv_1',
  url: null,
  invitedBy: 'user_admin',
  invitedAt: new Date('2026-11-13T12:00:00Z'),
  attestedBy: 'user_admin',
  attestedAt: new Date('2026-11-13T12:00:00Z'),
  acceptedAt: null,
  revokedAt: null,
  ...over,
})

beforeEach(() => {
  state.invitations = []
  state.users = new Map()
})

describe('acceptInvitationFor', () => {
  it('puts an invited person on the invited farm, as the invited role', async () => {
    state.invitations = [invitation()]

    const user = await acceptInvitationFor('user_alice', 'Alice@Farm.test')

    expect(user).toMatchObject({ id: 'user_alice', role: 'farmer', farmId: 'farm_a', email: 'alice@farm.test' })
    expect(state.invitations[0].acceptedAt).toBeInstanceOf(Date)
  })

  it('makes an admin when the invitation says admin', async () => {
    state.invitations = [invitation({ role: 'admin' })]
    expect((await acceptInvitationFor('user_alice', 'alice@farm.test'))?.role).toBe('admin')
  })

  it('lets nobody in who was not invited', async () => {
    state.invitations = [invitation()]

    expect(await acceptInvitationFor('user_mallory', 'mallory@farm.test')).toBeNull()
    expect(state.users.size).toBe(0)
    expect(state.invitations[0].acceptedAt).toBeNull()
  })

  it('lets nobody in on a revoked invitation', async () => {
    state.invitations = [invitation({ revokedAt: new Date() })]

    expect(await acceptInvitationFor('user_alice', 'alice@farm.test')).toBeNull()
    expect(state.users.size).toBe(0)
  })

  it('does not use an invitation twice', async () => {
    state.invitations = [invitation()]
    await acceptInvitationFor('user_alice', 'alice@farm.test')

    // A second Clerk account on the same address finds nothing left to take.
    expect(await acceptInvitationFor('user_alice_2', 'alice@farm.test')).toBeNull()
    expect(state.users.has('user_alice_2')).toBe(false)
  })

  it('assigns a signed-up farmer who was never given a farm', async () => {
    state.users.set('user_alice', {
      id: 'user_alice',
      role: 'farmer',
      farmId: null,
      email: null,
      createdAt: new Date(),
    })
    state.invitations = [invitation()]

    expect(await acceptInvitationFor('user_alice', 'alice@farm.test')).toMatchObject({
      farmId: 'farm_a',
    })
  })
})
