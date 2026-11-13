import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiKeyRow } from '../db/schema'

/**
 * Keys end to end against an in-memory store: issue one, use it, revoke it.
 * What matters is what the store ends up holding — and that a bad key and a
 * revoked key are told apart.
 */

const store = vi.hoisted(() => ({ rows: [] as ApiKeyRow[], windows: new Map<string, number>(), swept: 0 }))

vi.mock('../storage/api-keys', () => ({
  insertApiKey: async (row: Omit<ApiKeyRow, 'lastUsedAt' | 'revokedAt'>) => {
    store.rows.push({ ...row, lastUsedAt: null, revokedAt: null })
  },
  findApiKeyByHash: async (hash: string) => store.rows.find((r) => r.keyHash === hash) ?? null,
  getApiKey: async (id: string) => store.rows.find((r) => r.id === id) ?? null,
  touchApiKey: async (id: string, now: Date) => {
    const row = store.rows.find((r) => r.id === id)!
    if (!row.lastUsedAt || now.getTime() - row.lastUsedAt.getTime() >= 60_000) row.lastUsedAt = now
  },
  markApiKeyRevoked: async (id: string, at: Date) => {
    const row = store.rows.find((r) => r.id === id)!
    row.revokedAt ??= at
  },
  countRequest: async (keyId: string, windowStart: Date) => {
    const k = `${keyId}@${windowStart.toISOString()}`
    store.windows.set(k, (store.windows.get(k) ?? 0) + 1)
    return store.windows.get(k)!
  },
  deleteWindowsBefore: async () => {
    store.swept += 1
  },
}))

import { authenticateApiKey, issueKey, revokeKey } from './keys'
import { rateLimitHeaders } from './key-format'
import { checkRateLimit } from './rate-limit'

const request = (key?: string) =>
  new Request('http://localhost/api/v1/farms/availability', {
    headers: key ? { authorization: `Bearer ${key}` } : {},
  })

beforeEach(() => {
  store.rows = []
  store.windows = new Map()
  store.swept = 0
  delete process.env.API_RATE_LIMIT_PER_MIN
})

describe('an issued key', () => {
  it('authenticates', async () => {
    const issued = await issueKey('MABFC directory: test', 'user_admin')
    expect(await authenticateApiKey(request(issued.key))).toEqual({ ok: true, keyId: issued.id })
  })

  it('is stored as a hash, never as itself', async () => {
    const issued = await issueKey('MABFC directory: test', 'user_admin')
    expect(JSON.stringify(store.rows)).not.toContain(issued.key)
    expect(store.rows[0]).toMatchObject({ name: 'MABFC directory: test', createdBy: 'user_admin' })
    expect(store.rows[0].prefix).toBe(issued.prefix)
  })

  it('is a test key off production and a live key on it', async () => {
    delete process.env.VERCEL_ENV
    expect((await issueKey('a', 'u')).key).toMatch(/^bb_test_/)
    process.env.VERCEL_ENV = 'production'
    expect((await issueKey('b', 'u')).key).toMatch(/^bb_live_/)
    delete process.env.VERCEL_ENV
  })

  it('is refused with 403 once revoked, while a newly issued key works', async () => {
    const old = await issueKey('old', 'user_admin')
    expect(await revokeKey(old.id)).toBe(true)
    const fresh = await issueKey('new', 'user_admin')

    expect(await authenticateApiKey(request(old.key))).toEqual({ ok: false, status: 403 })
    expect(await authenticateApiKey(request(fresh.key))).toMatchObject({ ok: true })
  })

  it('keeps the first revocation time when revoked twice', async () => {
    const issued = await issueKey('k', 'u')
    await revokeKey(issued.id)
    const first = store.rows[0].revokedAt
    await revokeKey(issued.id)
    expect(store.rows[0].revokedAt).toBe(first)
  })

  it('records use at most once a minute', async () => {
    const issued = await issueKey('k', 'u')
    await authenticateApiKey(request(issued.key))
    const first = store.rows[0].lastUsedAt
    await authenticateApiKey(request(issued.key))
    expect(store.rows[0].lastUsedAt).toBe(first)
  })
})

describe('a request that is not from a real key', () => {
  it('gets 401 for no key, a malformed key, and a well-formed key nobody issued', async () => {
    await issueKey('k', 'u')
    const stranger = `bb_test_${'a'.repeat(32)}`
    expect(await authenticateApiKey(request())).toEqual({ ok: false, status: 401 })
    expect(await authenticateApiKey(request('nonsense'))).toEqual({ ok: false, status: 401 })
    expect(await authenticateApiKey(request(stranger))).toEqual({ ok: false, status: 401 })
  })

  it('cannot revoke a key that does not exist', async () => {
    expect(await revokeKey('nope')).toBe(false)
  })
})

describe('the rate limit', () => {
  const now = new Date('2026-11-19T14:05:10Z')

  it('lets 60 through in a minute and refuses the 61st with the right headers', async () => {
    for (let i = 1; i <= 60; i++) {
      expect((await checkRateLimit('key-1', now, () => 1)).allowed).toBe(true)
    }
    const refused = await checkRateLimit('key-1', now, () => 1)

    expect(refused.allowed).toBe(false)
    expect(rateLimitHeaders(refused)).toEqual({
      'RateLimit-Limit': '60',
      'RateLimit-Remaining': '0',
      'RateLimit-Reset': '50',
      'Retry-After': '50',
    })
  })

  it('counts each key on its own, and each minute fresh', async () => {
    for (let i = 0; i < 61; i++) await checkRateLimit('key-1', now, () => 1)
    expect((await checkRateLimit('key-2', now, () => 1)).remaining).toBe(59)
    expect((await checkRateLimit('key-1', new Date('2026-11-19T14:06:01Z'), () => 1)).remaining).toBe(59)
  })

  it('takes its limit from API_RATE_LIMIT_PER_MIN', async () => {
    process.env.API_RATE_LIMIT_PER_MIN = '2'
    await checkRateLimit('key-1', now, () => 1)
    await checkRateLimit('key-1', now, () => 1)
    expect((await checkRateLimit('key-1', now, () => 1)).allowed).toBe(false)
  })

  it('sweeps old windows about one request in a hundred', async () => {
    await checkRateLimit('key-1', now, () => 0.5)
    expect(store.swept).toBe(0)
    await checkRateLimit('key-1', now, () => 0.001)
    expect(store.swept).toBe(1)
  })
})
