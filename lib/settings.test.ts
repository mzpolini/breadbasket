import { afterEach, describe, expect, it } from 'vitest'
import { apiRateLimitPerMinute, FRESHNESS_DAYS, goneAfterDays } from './settings'

afterEach(() => {
  delete process.env.GONE_AFTER_DAYS
  delete process.env.API_RATE_LIMIT_PER_MIN
})

describe('goneAfterDays', () => {
  it('is seven unless told otherwise', () => {
    expect(goneAfterDays()).toBe(7)
  })

  it('is read from GONE_AFTER_DAYS, with no code change', () => {
    process.env.GONE_AFTER_DAYS = '10'
    expect(goneAfterDays()).toBe(10)
  })

  it('falls back rather than trusting something that is not a positive whole number', () => {
    for (const bad of ['', '  ', '0', '-3', '2.5', 'soon', 'NaN']) {
      process.env.GONE_AFTER_DAYS = bad
      expect(goneAfterDays(), JSON.stringify(bad)).toBe(7)
    }
  })

  it('is not the farm stand\'s flagging window — the two are separate decisions', () => {
    process.env.GONE_AFTER_DAYS = '14'
    expect(goneAfterDays()).toBe(14)
    expect(FRESHNESS_DAYS).toBe(7)
  })
})

describe('apiRateLimitPerMinute', () => {
  it('is 60 unless told otherwise, and follows API_RATE_LIMIT_PER_MIN', () => {
    expect(apiRateLimitPerMinute()).toBe(60)
    process.env.API_RATE_LIMIT_PER_MIN = '120'
    expect(apiRateLimitPerMinute()).toBe(120)
  })
})
