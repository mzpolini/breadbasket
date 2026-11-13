import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserRow } from '../db/schema'

/**
 * Who may do what — held to account at every door.
 *
 * The real `current-user` runs here; only its two inputs are faked (the Clerk
 * session and the `users` table) and everything it guards writes to is a spy.
 * So "refused" is proved the strong way: not that something threw, but that
 * nothing was written, started or sent.
 */

const NOT_FOUND = 'NEXT_NOT_FOUND'

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`)
  },
  notFound: () => {
    throw new Error(NOT_FOUND)
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'localhost:3000' }),
}))

const session = vi.hoisted(() => ({ userId: null as string | null }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: session.userId }),
  currentUser: async () => null,
  clerkClient: vi.fn(),
}))

const db = vi.hoisted(() => ({ users: new Map<string, unknown>() }))
vi.mock('../storage/users', () => ({
  getUserRecord: async (id: string) => db.users.get(id) ?? null,
  getUserByEmail: vi.fn(async () => null),
  assignFarmerToFarm: vi.fn(),
}))

// Everything an action or route could write to. None of it may be touched by a
// refused caller.
vi.mock('../storage/movements', () => ({ appendMovements: vi.fn() }))
vi.mock('../storage/harvest-rules', () => ({
  appendRules: vi.fn(),
  rulesForFarm: vi.fn(async () => []),
}))
vi.mock('../storage/proposals', () => ({
  publishOnce: vi.fn(async () => true),
  releasePublish: vi.fn(),
}))
vi.mock('../storage/vocabulary', () => ({ teach: vi.fn() }))
vi.mock('../storage/messages', () => ({
  messagesForFarm: vi.fn(async () => []),
  recentForContext: vi.fn(() => []),
  saveMessages: vi.fn(),
}))
vi.mock('../storage/notes', () => ({ notesForFarm: vi.fn(async () => []) }))
vi.mock('../storage/farms', () => ({
  getFarm: vi.fn(async (id: string) => ({ id, name: 'A farm', slug: id })),
  getFarmBySlug: vi.fn(async () => null),
  getFarmByDirectoryProfileId: vi.fn(async () => null),
  createFarm: vi.fn(async () => ({ id: 'farm_new' })),
}))
vi.mock('../storage/invitations', () => ({
  getInvitation: vi.fn(async () => ({
    id: 'inv-1',
    email: 'x@farm.test',
    farmId: 'farm_a',
    clerkInvitationId: 'cinv_1',
    acceptedAt: null,
    revokedAt: null,
  })),
  insertInvitation: vi.fn(),
  deleteInvitation: vi.fn(),
  markRevoked: vi.fn(),
  setClerkInvitation: vi.fn(),
  openInvitationsForEmail: vi.fn(async () => []),
}))
vi.mock('../invitations/clerk', () => ({
  sendClerkInvitation: vi.fn(async () => ({ id: 'cinv_2', url: null })),
  revokeClerkInvitation: vi.fn(),
}))
vi.mock('../api/keys', () => ({
  issueKey: vi.fn(async () => ({ id: 'k1', key: 'bb_test_x', prefix: 'bb_test_x' })),
  revokeKey: vi.fn(async () => true),
}))
vi.mock('../invitations/accept', () => ({ acceptInvitationFor: vi.fn(async () => null) }))

import { commitProposed, commitRules, markSoldOut } from '@/app/farm/[farmId]/actions'
import * as adminActions from '@/app/admin/_actions'
import { POST as chat } from '@/app/api/chat/route'
import { checkFarmAccess, requireAdmin, requireFarmAccess } from './current-user'
import { appendMovements } from '../storage/movements'
import { appendRules } from '../storage/harvest-rules'
import { saveMessages } from '../storage/messages'
import { assignFarmerToFarm } from '../storage/users'
import { createFarm as createFarmRecord } from '../storage/farms'
import { insertInvitation, markRevoked } from '../storage/invitations'
import { revokeClerkInvitation, sendClerkInvitation } from '../invitations/clerk'
import { issueKey, revokeKey } from '../api/keys'

const user = (over: Partial<UserRow> & Pick<UserRow, 'id' | 'role'>): UserRow => ({
  farmId: null,
  email: null,
  createdAt: new Date(),
  ...over,
})

function signInAs(row: UserRow | null) {
  session.userId = row?.id ?? null
  db.users = new Map(row ? [[row.id, row]] : [])
}

const farmer = user({ id: 'user_alice', role: 'farmer', farmId: 'farm_a' })
const admin = user({ id: 'user_admin', role: 'admin' })
const pending = user({ id: 'user_new', role: 'farmer' }) // farmer with no farm

const proposed = [
  {
    product: 'okra',
    heardAs: 'okra',
    rawPhrase: 'got okra',
    kind: 'add' as const,
    reason: null,
    amountValue: 5,
    amountUnit: 'lb',
    measured: true,
    forecast: false,
    windowFrom: null,
    windowTo: null,
  },
]
const rule = {
  product: 'okra',
  heardAs: 'okra',
  rawPhrase: 'okra every week',
  amountValue: 5,
  amountUnit: 'lb',
  interval: 'weekly',
  startsOn: null,
  endsOn: null,
  ended: false,
}
const chatRequest = (farmId: unknown) =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({ farmId, message: { id: 'm1', role: 'user', parts: [] } }),
  })

/** Every admin action, called with plausible arguments. */
const adminCalls: [string, () => Promise<unknown>][] = [
  ['createFarm', () => adminActions.createFarm({ name: 'New', slug: 'new' })],
  ['assignFarmerToFarm', () => adminActions.assignFarmerToFarm('user_x', 'farm_a')],
  [
    'inviteToFarm',
    () =>
      adminActions.inviteToFarm({
        farmId: 'farm_a',
        email: 'x@farm.test',
        role: 'farmer',
        attested: true,
      }),
  ],
  ['resendInvitation', () => adminActions.resendInvitation('inv-1')],
  ['revokeInvitation', () => adminActions.revokeInvitation('inv-1')],
  ['issueApiKey', () => adminActions.issueApiKey('MABFC directory: staging')],
  ['revokeApiKey', () => adminActions.revokeApiKey('k1')],
]

beforeEach(() => {
  vi.clearAllMocks()
  signInAs(null)
})

describe('a farmer', () => {
  beforeEach(() => signInAs(farmer))

  it('may use their own farm', async () => {
    await expect(requireFarmAccess('farm_a')).resolves.toMatchObject({ clerkId: 'user_alice' })
    await expect(commitProposed('farm_a', proposed)).resolves.toMatchObject({ written: 1 })
    expect(appendMovements).toHaveBeenCalledOnce()
  })

  it("is refused another farm's pages", async () => {
    await expect(requireFarmAccess('farm_b')).rejects.toThrow(NOT_FOUND)
    expect(await checkFarmAccess('farm_b')).toEqual({ ok: false, status: 403 })
  })

  it("is refused another farm's actions, and nothing is written", async () => {
    await expect(commitProposed('farm_b', proposed)).rejects.toThrow(NOT_FOUND)
    await expect(commitRules('farm_b', [rule])).rejects.toThrow(NOT_FOUND)
    await expect(markSoldOut('farm_b', 'okra')).rejects.toThrow(NOT_FOUND)
    expect(appendMovements).not.toHaveBeenCalled()
    expect(appendRules).not.toHaveBeenCalled()
  })

  it("is refused another farm's chat, and nothing is saved", async () => {
    const response = await chat(chatRequest('farm_b'))
    expect(response.status).toBe(403)
    expect(saveMessages).not.toHaveBeenCalled()
  })

  it('is refused /admin', async () => {
    await expect(requireAdmin()).rejects.toThrow(NOT_FOUND)
  })

  it.each(adminCalls)('is refused the admin action %s, and nothing happens', async (_name, call) => {
    await expect(call()).rejects.toThrow(NOT_FOUND)
    expect(createFarmRecord).not.toHaveBeenCalled()
    expect(assignFarmerToFarm).not.toHaveBeenCalled()
    expect(insertInvitation).not.toHaveBeenCalled()
    expect(sendClerkInvitation).not.toHaveBeenCalled()
    expect(revokeClerkInvitation).not.toHaveBeenCalled()
    expect(markRevoked).not.toHaveBeenCalled()
    expect(issueKey).not.toHaveBeenCalled()
    expect(revokeKey).not.toHaveBeenCalled()
  })
})

describe('an admin', () => {
  beforeEach(() => signInAs(admin))

  it('may reach any farm, and the write says who did it', async () => {
    await expect(requireFarmAccess('farm_b')).resolves.toMatchObject({ role: 'admin' })
    expect(await checkFarmAccess('farm_b')).toMatchObject({ ok: true })
    await expect(commitProposed('farm_b', proposed)).resolves.toMatchObject({ written: 1 })
    expect(vi.mocked(appendMovements).mock.calls[0][0][0]).toMatchObject({
      farmId: 'farm_b',
      postedBy: 'user_admin',
    })
  })

  it('may reach /admin, and is handed back as the actor', async () => {
    await expect(requireAdmin()).resolves.toMatchObject({ role: 'admin', clerkId: 'user_admin' })
  })

  it('may use every admin action', async () => {
    for (const [name, call] of adminCalls) {
      await expect(call(), name).resolves.not.toThrow()
    }
    expect(createFarmRecord).toHaveBeenCalled()
    expect(assignFarmerToFarm).toHaveBeenCalled()
    expect(insertInvitation).toHaveBeenCalled()
    expect(sendClerkInvitation).toHaveBeenCalled()
    expect(revokeClerkInvitation).toHaveBeenCalled()
    expect(issueKey).toHaveBeenCalledWith('MABFC directory: staging', 'user_admin')
    expect(revokeKey).toHaveBeenCalledWith('k1')
  })

  it("is refused a chat with no farm, rather than writing to nothing", async () => {
    expect((await chat(chatRequest(undefined))).status).toBe(400)
    expect(saveMessages).not.toHaveBeenCalled()
  })
})

describe('someone signed in with no invitation and no farm', () => {
  beforeEach(() => signInAs(pending))

  it('lands on /onboarding from any farm page', async () => {
    await expect(requireFarmAccess('farm_a')).rejects.toThrow('REDIRECT /onboarding')
  })

  it('is refused every action and every admin door', async () => {
    await expect(commitProposed('farm_a', proposed)).rejects.toThrow('REDIRECT /onboarding')
    await expect(requireAdmin()).rejects.toThrow(NOT_FOUND)
    expect(await checkFarmAccess('farm_a')).toEqual({ ok: false, status: 403 })
    expect(appendMovements).not.toHaveBeenCalled()
  })
})

describe('someone who is not signed in', () => {
  it('is sent to sign in, and nothing is written', async () => {
    await expect(requireFarmAccess('farm_a')).rejects.toThrow('REDIRECT /sign-in')
    await expect(requireAdmin()).rejects.toThrow('REDIRECT /sign-in')
    await expect(commitProposed('farm_a', proposed)).rejects.toThrow('REDIRECT /sign-in')
    expect((await chat(chatRequest('farm_a'))).status).toBe(401)
    expect(appendMovements).not.toHaveBeenCalled()
    expect(saveMessages).not.toHaveBeenCalled()
  })
})
