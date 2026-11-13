import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiKeyRow, FarmRow } from '../db/schema'
import type { HarvestRule } from '../cadence'
import type { Movement } from '../ledger'

/**
 * The read API through its real routes: key check, rate limit, projection,
 * contract, caching headers. Storage is in memory, and every read is a spy —
 * so "refused" means nothing was read, and "two queries" is counted.
 */

const NOW = new Date('2026-11-19T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString()

const db = vi.hoisted(() => ({
  keys: [] as ApiKeyRow[],
  windows: new Map<string, number>(),
  farms: [] as unknown[],
  movements: [] as unknown[],
  rules: [] as unknown[],
  reads: { farms: 0, movements: 0, rules: 0 },
}))

vi.mock('../storage/api-keys', () => ({
  insertApiKey: async (row: Omit<ApiKeyRow, 'lastUsedAt' | 'revokedAt'>) => {
    db.keys.push({ ...row, lastUsedAt: null, revokedAt: null })
  },
  findApiKeyByHash: async (hash: string) => db.keys.find((k) => k.keyHash === hash) ?? null,
  getApiKey: async (id: string) => db.keys.find((k) => k.id === id) ?? null,
  touchApiKey: async () => {},
  markApiKeyRevoked: async (id: string, at: Date) => {
    db.keys.find((k) => k.id === id)!.revokedAt = at
  },
  countRequest: async (keyId: string, start: Date) => {
    const k = `${keyId}@${start.toISOString()}`
    db.windows.set(k, (db.windows.get(k) ?? 0) + 1)
    return db.windows.get(k)!
  },
  deleteWindowsBefore: async () => {},
}))
vi.mock('../storage/farms', () => ({
  mappedFarms: async (ids?: string[]) => {
    db.reads.farms++
    // Deliberately returns whatever matches the ids — verified or not — so the
    // code's own check of the mapped rule is what is on trial.
    return (db.farms as FarmRow[]).filter((f) => !ids || ids.includes(f.id))
  },
}))
vi.mock('../storage/movements', () => ({
  movementsForFarms: async (ids: string[]) => {
    db.reads.movements++
    return (db.movements as Movement[]).filter((m) => ids.includes(m.farmId))
  },
}))
vi.mock('../storage/harvest-rules', () => ({
  rulesForFarms: async (ids: string[]) => {
    db.reads.rules++
    return (db.rules as HarvestRule[]).filter((r) => ids.includes(r.farmId))
  },
}))

import { GET as bulk } from '@/app/api/v1/farms/availability/route'
import { GET as single } from '@/app/api/v1/farms/[farm_id]/availability/route'
import { issueKey, revokeKey } from './keys'

const doc = JSON.parse(readFileSync(join(process.cwd(), 'public', 'openapi.json'), 'utf8'))
// The published document is the contract: responses are held to *it*, not to the
// Zod the handler already parsed with.
const defs = JSON.parse(JSON.stringify(doc.components.schemas).replaceAll('#/components/schemas/', '#/$defs/'))
const schema = (name: string) => z.fromJSONSchema({ $ref: `#/$defs/${name}`, $defs: defs })

let n = 0
const farm = (over: Partial<FarmRow>): FarmRow => ({
  id: 'farm_a',
  name: 'Greenacre',
  slug: 'greenacre',
  directoryProfileId: 'mabfc-1',
  kyfVerified: true,
  tagline: null,
  market: null,
  logo: null,
  createdAt: new Date(),
  ...over,
})
const movement = (over: Partial<Movement> & Pick<Movement, 'farmId' | 'product'>): Movement => ({
  id: `m${++n}`,
  kind: 'add',
  measured: true,
  state: 'confirmed',
  source: 'farmer',
  sessionId: 's',
  occurredAt: ago(1),
  rawPhrase: 'I got a LOT of these, call me on 555-0100',
  postedBy: 'user_secret_farmer',
  ...over,
})
const rule = (over: Partial<HarvestRule> & Pick<HarvestRule, 'farmId' | 'product'>): HarvestRule => ({
  id: `r${++n}`,
  rawPhrase: 'twenty pounds every week, text me at farmer@example.com',
  interval: 'weekly',
  ended: false,
  createdAt: ago(1),
  postedBy: 'user_secret_farmer',
  ...over,
})

const call = (path: string, key?: string, headers: Record<string, string> = {}) => {
  const req = new Request(`https://api.test${path}`, {
    headers: { ...(key ? { authorization: `Bearer ${key}` } : {}), ...headers },
  })
  const farmId = path.match(/^\/api\/v1\/farms\/([^/?]+)\/availability/)?.[1]
  return farmId
    ? single(req, { params: Promise.resolve({ farm_id: farmId }) })
    : bulk(req, undefined)
}
const reads = () => db.reads.farms + db.reads.movements + db.reads.rules

let key: string

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  db.keys = []
  db.windows = new Map()
  db.reads = { farms: 0, movements: 0, rules: 0 }
  delete process.env.API_RATE_LIMIT_PER_MIN
  delete process.env.PUBLIC_BASE_URL

  db.farms = [
    farm({ id: 'farm_a', slug: 'greenacre', directoryProfileId: 'mabfc-1' }),
    farm({ id: 'farm_b', slug: 'sweetwater', directoryProfileId: 'mabfc-2' }),
    farm({ id: 'farm_c', slug: 'hilltop', directoryProfileId: 'mabfc-3' }),
    // Neither of these may ever appear.
    farm({ id: 'farm_unverified', slug: 'u', kyfVerified: false, directoryProfileId: 'mabfc-9' }),
    farm({ id: 'farm_unmapped', slug: 'm', kyfVerified: true, directoryProfileId: null }),
  ]
  db.movements = [
    movement({ farmId: 'farm_a', product: 'collards', amount: { value: 40, unit: 'lb' } }),
    movement({ farmId: 'farm_a', product: 'okra', kind: 'remove', occurredAt: ago(0.5) }),
    movement({ farmId: 'farm_b', product: 'sweet potatoes', occurredAt: ago(2) }),
    movement({ farmId: 'farm_c', product: 'lettuce', state: 'forecast', window: { from: '2026-11-25', to: '2026-12-02' } }),
    movement({ farmId: 'farm_unverified', product: 'secret tomatoes' }),
    movement({ farmId: 'farm_unmapped', product: 'secret peppers' }),
  ]
  db.rules = [rule({ farmId: 'farm_b', product: 'watermelon', startsOn: '2026-12-01', endsOn: '2027-03-31' })]

  key = (await issueKey('test', 'user_admin')).key
  db.reads = { farms: 0, movements: 0, rules: 0 }
})

afterEach(() => vi.useRealTimers())

describe('the key', () => {
  it('refuses a missing or unknown key with 401, and reads nothing', async () => {
    for (const bad of [undefined, 'nonsense', `bb_test_${'a'.repeat(32)}`]) {
      const response = await call('/api/v1/farms/availability', bad)
      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        error: { code: 'unauthorized', message: expect.any(String) },
      })
    }
    expect(reads()).toBe(0)
  })

  it('refuses a revoked key with 403, and reads nothing', async () => {
    const { key: old, id } = await issueKey('old', 'user_admin')
    await revokeKey(id)

    const response = await call('/api/v1/farms/availability', old)

    expect(response.status).toBe(403)
    expect((await response.json()).error.code).toBe('key_revoked')
    expect(reads()).toBe(0)
    // And a key issued afterwards still works.
    expect((await call('/api/v1/farms/availability', key)).status).toBe(200)
  })

  it('applies to the single-farm endpoint too', async () => {
    expect((await call('/api/v1/farms/farm_a/availability')).status).toBe(401)
    expect(reads()).toBe(0)
  })

  it('sends no rate-limit headers to a caller with no valid key', async () => {
    const response = await call('/api/v1/farms/availability')
    expect(response.headers.get('RateLimit-Limit')).toBeNull()
  })
})

describe('the bulk endpoint', () => {
  it('returns every mapped farm, with every field from the contract', async () => {
    const response = await call('/api/v1/farms/availability', key)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(() => schema('BulkAvailabilityResponse').parse(body)).not.toThrow()
    expect(body.farms.map((f: { farm_id: string }) => f.farm_id)).toEqual(['farm_a', 'farm_b', 'farm_c'])
    expect(body.farms[0]).toMatchObject({
      farm_id: 'farm_a',
      directory_profile_id: 'mabfc-1',
      farm_stand_url: 'https://api.test/f/greenacre',
    })
    expect(body.generated_at).toBe(NOW.toISOString())
  })

  it('reports each status: in season, coming soon, gone', async () => {
    const body = await (await call('/api/v1/farms/availability', key)).json()
    const status = (farmId: string, product: string) =>
      body.farms
        .find((f: { farm_id: string }) => f.farm_id === farmId)
        .items.find((i: { product: string }) => i.product === product)

    expect(status('farm_a', 'collards').status).toBe('in_season')
    expect(status('farm_a', 'okra').status).toBe('gone')
    expect(status('farm_b', 'watermelon')).toMatchObject({
      status: 'coming_soon',
      expected_from: '2026-12-01',
      available_until: '2027-03-31',
    })
    expect(status('farm_c', 'lettuce')).toMatchObject({
      status: 'coming_soon',
      expected_from: '2026-11-25',
    })
  })

  it('reads inventory in two queries however many farms there are', async () => {
    await call('/api/v1/farms/availability', key)
    expect(db.reads).toEqual({ farms: 1, movements: 1, rules: 1 })
  })

  it('never includes a farm that is unverified or unmapped, even if storage returns it', async () => {
    const text = await (await call('/api/v1/farms/availability', key)).text()
    expect(text).not.toMatch(/farm_unverified|farm_unmapped|secret tomatoes|secret peppers/)
  })

  it('is empty, not an error, when no farm is mapped', async () => {
    db.farms = []
    const body = await (await call('/api/v1/farms/availability', key)).json()
    expect(body.farms).toEqual([])
  })

  it('leaks nothing a farmer said, nobody\'s email, and no user id', async () => {
    const text = await (await call('/api/v1/farms/availability', key)).text()
    expect(text).not.toMatch(/555-0100|farmer@example|user_secret|LOT of these|twenty pounds/)
  })

  it('points farm stand URLs at PUBLIC_BASE_URL when it is set', async () => {
    process.env.PUBLIC_BASE_URL = 'https://app.example.org/'
    const body = await (await call('/api/v1/farms/availability', key)).json()
    expect(body.farms[0].farm_stand_url).toBe('https://app.example.org/f/greenacre')
  })

  it('limits to farm_ids, leaving unknown and unmapped ones out rather than failing', async () => {
    const body = await (
      await call('/api/v1/farms/availability?farm_ids=farm_b,nope,farm_unverified', key)
    ).json()
    expect(body.farms.map((f: { farm_id: string }) => f.farm_id)).toEqual(['farm_b'])
  })

  it('answers a bad farm_ids with 400', async () => {
    for (const query of ['farm_ids=', 'farm_ids=a,,b']) {
      const response = await call(`/api/v1/farms/availability?${query}`, key)
      expect(response.status).toBe(400)
      expect((await response.json()).error.code).toBe('bad_request')
    }
    const many = Array.from({ length: 101 }, (_, i) => `f${i}`).join(',')
    const tooMany = await call(`/api/v1/farms/availability?farm_ids=${many}`, key)
    expect(tooMany.status).toBe(400)
    expect((await tooMany.json()).error.message).toBe('farm_ids accepts at most 100 IDs.')
  })
})

describe('the single-farm endpoint', () => {
  it('returns one farm, matching the contract', async () => {
    const response = await call('/api/v1/farms/farm_a/availability', key)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(() => schema('FarmAvailability').parse(body)).not.toThrow()
    expect(body.farm_id).toBe('farm_a')
    expect(reads()).toBe(3)
  })

  it('answers an unverified farm, an unmapped farm and a missing farm identically', async () => {
    const answers = await Promise.all(
      ['farm_unverified', 'farm_unmapped', 'farm_nope'].map(async (id) => {
        const response = await call(`/api/v1/farms/${id}/availability`, key)
        return [response.status, await response.json()]
      }),
    )
    expect(answers[0]).toEqual([404, { error: { code: 'not_found', message: 'Farm not found.' } }])
    expect(answers[1]).toEqual(answers[0])
    expect(answers[2]).toEqual(answers[0])
  })
})

describe('headers and caching', () => {
  it('sends Cache-Control, an ETag and the rate limit headers', async () => {
    const response = await call('/api/v1/farms/availability', key)

    expect(response.headers.get('Cache-Control')).toBe('private, max-age=300')
    expect(response.headers.get('ETag')).toMatch(/^W\/"[A-Za-z0-9_-]{27}"$/)
    expect(response.headers.get('RateLimit-Limit')).toBe('60')
    expect(response.headers.get('RateLimit-Remaining')).toBe('59')
    expect(response.headers.get('RateLimit-Reset')).toBe('60')
  })

  it('answers 304, with no body, when If-None-Match matches', async () => {
    const first = await call('/api/v1/farms/availability', key)
    const etag = first.headers.get('ETag')!

    const again = await call('/api/v1/farms/availability', key, { 'If-None-Match': etag })

    expect(again.status).toBe(304)
    expect(await again.text()).toBe('')
    expect(again.headers.get('ETag')).toBe(etag)
  })

  it('keeps the same ETag when only the clock moved', async () => {
    const first = await call('/api/v1/farms/availability', key)
    vi.setSystemTime(new Date(NOW.getTime() + 30_000))
    const later = await call('/api/v1/farms/availability', key)
    expect(later.headers.get('ETag')).toBe(first.headers.get('ETag'))
    expect((await later.json()).generated_at).not.toBe((await first.json()).generated_at)
  })

  it('changes the ETag when what a farm says changes', async () => {
    const before = (await call('/api/v1/farms/availability', key)).headers.get('ETag')
    db.movements.push(movement({ farmId: 'farm_a', product: 'beans' }))
    const after = await call('/api/v1/farms/availability', key, { 'If-None-Match': before! })

    expect(after.status).toBe(200)
    expect(after.headers.get('ETag')).not.toBe(before)
  })

  it('sends the ETag of the single-farm body too', async () => {
    const first = await call('/api/v1/farms/farm_a/availability', key)
    const again = await call('/api/v1/farms/farm_a/availability', key, {
      'If-None-Match': first.headers.get('ETag')!,
    })
    expect(again.status).toBe(304)
  })

  it('treats a weak and a strong spelling of the same tag as a match', async () => {
    const etag = (await call('/api/v1/farms/availability', key)).headers.get('ETag')!
    const strong = etag.replace(/^W\//, '')
    const again = await call('/api/v1/farms/availability', key, { 'If-None-Match': strong })
    expect(again.status).toBe(304)
  })
})

describe('the rate limit', () => {
  it('refuses the 61st request in a minute with 429 and Retry-After, and reads nothing for it', async () => {
    for (let i = 0; i < 60; i++) expect((await call('/api/v1/farms/availability', key)).status).toBe(200)
    db.reads = { farms: 0, movements: 0, rules: 0 }

    const response = await call('/api/v1/farms/availability', key)

    expect(response.status).toBe(429)
    expect((await response.json()).error.code).toBe('rate_limited')
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('RateLimit-Remaining')).toBe('0')
    expect(reads()).toBe(0)
  })

  it('lets the key back in at the next minute', async () => {
    process.env.API_RATE_LIMIT_PER_MIN = '1'
    await call('/api/v1/farms/availability', key)
    expect((await call('/api/v1/farms/availability', key)).status).toBe(429)

    vi.setSystemTime(new Date(NOW.getTime() + 61_000))
    expect((await call('/api/v1/farms/availability', key)).status).toBe(200)
  })

  it('counts a 304 and a 404 against the limit like any other request', async () => {
    process.env.API_RATE_LIMIT_PER_MIN = '2'
    await call('/api/v1/farms/nope/availability', key)
    await call('/api/v1/farms/nope/availability', key)
    expect((await call('/api/v1/farms/nope/availability', key)).status).toBe(429)
  })
})
