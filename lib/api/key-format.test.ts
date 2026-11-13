import { describe, expect, it } from 'vitest'
import {
  bearerToken,
  generateKey,
  hashKey,
  keyEnvironment,
  keyPrefix,
  looksLikeKey,
  rateLimitHeaders,
  rateStatus,
  windowStart,
} from './key-format'

describe('generateKey', () => {
  it('is bb_<env>_ and 32 base-62 characters', () => {
    expect(generateKey('live')).toMatch(/^bb_live_[0-9A-Za-z]{32}$/)
    expect(generateKey('test')).toMatch(/^bb_test_[0-9A-Za-z]{32}$/)
  })

  it('does not repeat', () => {
    expect(new Set(Array.from({ length: 200 }, () => generateKey('live'))).size).toBe(200)
  })

  it('skips biased bytes rather than wrapping them', () => {
    // Bytes 248+ would make the first characters more likely; they are dropped.
    const bytes = [...new Uint8Array(64).fill(255), ...new Uint8Array(64).fill(1)]
    let call = 0
    const key = generateKey('test', () => bytes.slice(call++ * 64, call * 64) as unknown as Uint8Array)
    expect(key).toBe(`bb_test_${'1'.repeat(32)}`)
  })

  it('is recognised by looksLikeKey, and nothing else is', () => {
    expect(looksLikeKey(generateKey('live'))).toBe(true)
    for (const bad of ['', 'bb_live_short', 'sk_live_' + 'a'.repeat(32), `bb_live_${'a'.repeat(33)}`]) {
      expect(looksLikeKey(bad)).toBe(false)
    }
  })
})

describe('keyEnvironment', () => {
  it('issues live keys only on production', () => {
    expect(keyEnvironment('production')).toBe('live')
    for (const other of ['preview', 'development', undefined]) {
      expect(keyEnvironment(other)).toBe('test')
    }
  })
})

describe('hashing', () => {
  it('is a stable SHA-256 hex digest', () => {
    expect(hashKey('bb_test_abc')).toBe(hashKey('bb_test_abc'))
    expect(hashKey('bb_test_abc')).toMatch(/^[0-9a-f]{64}$/)
    expect(hashKey('bb_test_abc')).not.toBe(hashKey('bb_test_abd'))
  })

  it('does not contain the key', () => {
    const key = generateKey('live')
    expect(hashKey(key)).not.toContain(key.slice(8))
  })

  it('keeps a prefix that identifies the key but cannot be used as one', () => {
    const key = generateKey('live')
    expect(keyPrefix(key)).toHaveLength(12)
    expect(key.startsWith(keyPrefix(key))).toBe(true)
    expect(looksLikeKey(keyPrefix(key))).toBe(false)
  })
})

describe('bearerToken', () => {
  it('reads a bearer header, any casing', () => {
    expect(bearerToken('Bearer abc')).toBe('abc')
    expect(bearerToken('bearer abc')).toBe('abc')
  })

  it('is null for anything else', () => {
    for (const header of [null, '', 'abc', 'Basic abc', 'Bearer', 'Bearer a b']) {
      expect(bearerToken(header)).toBeNull()
    }
  })
})

describe('the rate window', () => {
  const at = (iso: string) => new Date(iso)

  it('is the minute a request falls in', () => {
    expect(windowStart(at('2026-11-19T14:05:37.250Z')).toISOString()).toBe('2026-11-19T14:05:00.000Z')
  })

  it('allows the 60th request in a minute and refuses the 61st', () => {
    const now = at('2026-11-19T14:05:10Z')
    expect(rateStatus(1, 60, now)).toMatchObject({ allowed: true, remaining: 59 })
    expect(rateStatus(60, 60, now)).toMatchObject({ allowed: true, remaining: 0 })
    expect(rateStatus(61, 60, now)).toMatchObject({ allowed: false, remaining: 0 })
  })

  it('counts down to the next minute, never reporting zero', () => {
    expect(rateStatus(1, 60, at('2026-11-19T14:05:10Z')).resetSeconds).toBe(50)
    expect(rateStatus(1, 60, at('2026-11-19T14:05:59.900Z')).resetSeconds).toBe(1)
    expect(rateStatus(1, 60, at('2026-11-19T14:06:00Z')).resetSeconds).toBe(60)
  })

  it('sends Retry-After only once the limit is hit', () => {
    const now = at('2026-11-19T14:05:10Z')
    expect(rateLimitHeaders(rateStatus(5, 60, now))).toEqual({
      'RateLimit-Limit': '60',
      'RateLimit-Remaining': '55',
      'RateLimit-Reset': '50',
    })
    expect(rateLimitHeaders(rateStatus(61, 60, now))).toMatchObject({
      'RateLimit-Remaining': '0',
      'Retry-After': '50',
    })
  })
})
