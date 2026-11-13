import { describe, expect, it } from 'vitest'
import { farmStandUrl, isValidSlug, newFarmId, toSlug } from './index'

describe('newFarmId', () => {
  it('is farm_ plus twelve lowercase base-36 characters', () => {
    expect(newFarmId()).toMatch(/^farm_[a-z0-9]{12}$/)
  })

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newFarmId()))
    expect(ids.size).toBe(1000)
  })

  it('skips biased bytes rather than wrapping them', () => {
    // 252..255 would map to 0..3 again and over-weight "a".."d".
    let call = 0
    const bytes = (n: number) => {
      call += 1
      return new Uint8Array(n).fill(call === 1 ? 255 : 1)
    }
    expect(newFarmId(bytes)).toBe('farm_bbbbbbbbbbbb')
  })
})

describe('toSlug', () => {
  it('makes a readable URL segment', () => {
    expect(toSlug('Greenacre Farm!')).toBe('greenacre-farm')
    expect(toSlug('  Sweet  Potato -- Co.  ')).toBe('sweet-potato-co')
    expect(toSlug('Café Ñandú')).toBe('cafe-nandu')
  })

  it('returns null when nothing usable is left', () => {
    expect(toSlug('!!!')).toBeNull()
    expect(toSlug('a')).toBeNull()
  })

  it('caps the length without leaving a trailing hyphen', () => {
    const slug = toSlug(`${'a'.repeat(63)} b`)!
    expect(slug.length).toBeLessThanOrEqual(64)
    expect(isValidSlug(slug)).toBe(true)
  })
})

describe('isValidSlug', () => {
  it('accepts the seed farm and rejects anything that needs escaping', () => {
    expect(isValidSlug('seed-farm')).toBe(true)
    expect(isValidSlug('Seed-Farm')).toBe(false)
    expect(isValidSlug('seed--farm')).toBe(false)
    expect(isValidSlug('-seed')).toBe(false)
    expect(isValidSlug('seed/farm')).toBe(false)
  })
})

describe('farmStandUrl', () => {
  it('joins the base URL and the slug', () => {
    expect(farmStandUrl({ slug: 'greenacre' }, 'https://breadbasket.example/')).toBe(
      'https://breadbasket.example/f/greenacre',
    )
  })

  it('is relative without a base URL', () => {
    expect(farmStandUrl({ slug: 'greenacre' }, undefined)).toBe('/f/greenacre')
  })
})
