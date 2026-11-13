import { describe, expect, it } from 'vitest'
import { Item } from '../api/contract'
import type { HarvestRule } from '../cadence'
import { balancesFrom, type Movement } from '../ledger'
import { apiItems, farmLastUpdated, GONE_REPORTED_DAYS } from './api'

/**
 * What the directory is told, status by status. Everything goes through the real
 * fold (`balancesFrom`) rather than hand-built balances, so these tests break if
 * the API and the ledger ever mean different things by "none left".
 */

const NOW = new Date('2026-11-19T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const GONE_AFTER = 7

/** An ISO timestamp this many days before NOW (fractions allowed). */
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString()

let n = 0
const movement = (over: Partial<Movement> & Pick<Movement, 'product'>): Movement => ({
  id: `m${++n}`,
  farmId: 'farm_a',
  kind: 'add',
  measured: true,
  state: 'confirmed',
  source: 'farmer',
  sessionId: 's1',
  occurredAt: ago(1),
  ...over,
})

const rule = (over: Partial<HarvestRule> & Pick<HarvestRule, 'product'>): HarvestRule => ({
  id: `r${++n}`,
  farmId: 'farm_a',
  rawPhrase: 'about twenty pounds every week',
  interval: 'weekly',
  ended: false,
  createdAt: ago(1),
  ...over,
})

function items(movements: Movement[], rules: HarvestRule[] = [], goneAfterDays = GONE_AFTER) {
  const balances = balancesFrom(movements, { now: NOW, freshnessDays: 7 })
  return apiItems(balances, rules, { now: NOW, goneAfterDays })
}

describe('in_season', () => {
  it('is something the farmer has now and has spoken about recently', () => {
    const [okra] = items([movement({ product: 'okra', amount: { value: 5, unit: 'lb' }, occurredAt: ago(2) })])

    expect(okra).toMatchObject({
      product: 'okra',
      status: 'in_season',
      last_updated: ago(2),
      expected_from: null,
      available_until: null,
    })
  })

  it('counts presence with no number — "I\'ve got collards"', () => {
    expect(items([movement({ product: 'collards' })])[0].status).toBe('in_season')
  })

  it('is still in season a moment before the silence threshold', () => {
    expect(items([movement({ product: 'okra', occurredAt: ago(6.99) })])[0].status).toBe('in_season')
  })

  it('takes available_until from a standing rule for the same crop', () => {
    const list = items(
      [movement({ product: 'watermelon' })],
      [rule({ product: 'watermelon', endsOn: '2026-12-31' })],
    )
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ status: 'in_season', available_until: '2026-12-31' })
  })

  it('leaves available_until null when there is no rule', () => {
    expect(items([movement({ product: 'watermelon' })])[0].available_until).toBeNull()
  })
})

describe('gone', () => {
  it('is none left — the farmer said so, and it reads gone at once', () => {
    // A reduction with no number empties the position (ADR 0002).
    const list = items([
      movement({ product: 'okra', amount: { value: 5, unit: 'lb' }, occurredAt: ago(3) }),
      movement({ product: 'okra', kind: 'remove', reason: 'wildlife', occurredAt: ago(0.01) }),
    ])
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ status: 'gone', last_updated: ago(0.01) })
  })

  it('is silence past the threshold, at exactly the threshold', () => {
    expect(items([movement({ product: 'okra', occurredAt: ago(7) })])[0].status).toBe('gone')
    expect(items([movement({ product: 'okra', occurredAt: ago(30) })]).length).toBe(0)
  })

  it('moves with goneAfterDays, with no other change', () => {
    const silent = [movement({ product: 'okra', occurredAt: ago(10) })]
    expect(items(silent, [], 14)[0].status).toBe('in_season')
    expect(items(silent, [], 7)[0].status).toBe('gone')
    expect(items(silent, [], 3)[0].status).toBe('gone')
  })

  it('is a position sold down to zero by arithmetic', () => {
    const list = items([
      movement({ product: 'okra', amount: { value: 5, unit: 'lb' } }),
      movement({ product: 'okra', kind: 'remove', amount: { value: 5, unit: 'lb' }, occurredAt: ago(0.5) }),
    ])
    expect(list[0].status).toBe('gone')
  })

  it('is reported for 14 days after it goes, then omitted — none left', () => {
    const wentAgo = (days: number) =>
      items([movement({ product: 'okra', kind: 'remove', occurredAt: ago(days) })])

    expect(GONE_REPORTED_DAYS).toBe(14)
    expect(wentAgo(13.9)).toHaveLength(1)
    expect(wentAgo(14)).toHaveLength(0)
  })

  it('counts the 14 days from when the silence ran out, not from the last word', () => {
    // Last spoke 20 days ago → went gone 13 days ago → still reported.
    expect(items([movement({ product: 'okra', occurredAt: ago(20) })])).toHaveLength(1)
    // Last spoke 21 days ago → went gone exactly 14 days ago → omitted.
    expect(items([movement({ product: 'okra', occurredAt: ago(21) })])).toHaveLength(0)
  })

  it('is lifted by anything he says afterwards', () => {
    const list = items([
      movement({ product: 'okra', kind: 'remove', occurredAt: ago(3) }),
      movement({ product: 'okra', amount: { value: 8, unit: 'lb' }, occurredAt: ago(1) }),
    ])
    expect(list[0].status).toBe('in_season')
  })
})

describe('coming_soon', () => {
  it('is a standing harvest rule, in its own dates', () => {
    const list = items(
      [],
      [rule({ product: 'watermelon', startsOn: '2026-12-01', endsOn: '2027-03-31', createdAt: ago(2) })],
    )
    expect(list).toEqual([
      expect.objectContaining({
        product: 'watermelon',
        status: 'coming_soon',
        expected_from: '2026-12-01',
        available_until: '2027-03-31',
        last_updated: ago(2),
      }),
    ])
  })

  it('has no dates when the rule gave none', () => {
    const [watermelon] = items([], [rule({ product: 'watermelon' })])
    expect(watermelon).toMatchObject({ expected_from: null, available_until: null })
  })

  it('is not shown once the rule is ended or its end date has passed', () => {
    expect(items([], [rule({ product: 'a', ended: true })])).toHaveLength(0)
    expect(items([], [rule({ product: 'b', endsOn: '2026-11-18' })])).toHaveLength(0)
    expect(items([], [rule({ product: 'c', endsOn: '2026-11-19' })])).toHaveLength(1)
  })

  it('follows the newest rule when one supersedes another', () => {
    const first = rule({ product: 'watermelon', endsOn: '2026-12-31', createdAt: ago(5) })
    const second = rule({ product: 'watermelon', endsOn: '2027-01-31', supersedesId: first.id, createdAt: ago(1) })
    expect(items([], [first, second])).toEqual([
      expect.objectContaining({ available_until: '2027-01-31' }),
    ])
  })

  it('is a dated one-off forecast, with its window', () => {
    const list = items([
      movement({
        product: 'lettuce',
        state: 'forecast',
        window: { from: '2026-11-25', to: '2026-12-02' },
        amount: { value: 30, unit: 'lb' },
        occurredAt: ago(2),
      }),
    ])
    expect(list[0]).toMatchObject({
      status: 'coming_soon',
      expected_from: '2026-11-25',
      available_until: '2026-12-02',
      last_updated: ago(2),
    })
  })

  it('is an undated forecast, with no dates rather than invented ones', () => {
    const [lettuce] = items([movement({ product: 'lettuce', state: 'forecast' })])
    expect(lettuce).toMatchObject({ status: 'coming_soon', expected_from: null, available_until: null })
  })

  it('is dropped once the forecast window has passed', () => {
    const past = movement({
      product: 'lettuce',
      state: 'forecast',
      window: { from: '2026-11-01', to: '2026-11-08' },
    })
    expect(items([past])).toHaveLength(0)
  })

  it('never makes a forecast into stock', () => {
    const list = items([movement({ product: 'lettuce', state: 'forecast', amount: { value: 30, unit: 'lb' } })])
    expect(list.map((i) => i.status)).toEqual(['coming_soon'])
  })

  it('is not made gone by silence — a rule stands until it ends', () => {
    expect(items([], [rule({ product: 'watermelon', createdAt: ago(40) })])[0].status).toBe('coming_soon')
  })
})

describe('one item per crop', () => {
  it('prefers in season over coming soon', () => {
    const list = items([movement({ product: 'okra' })], [rule({ product: 'okra' })])
    expect(list.map((i) => [i.product, i.status])).toEqual([['okra', 'in_season']])
  })

  it('prefers coming soon over gone: "none today, twenty pounds a week from Thursday"', () => {
    const list = items(
      [movement({ product: 'okra', kind: 'remove', occurredAt: ago(1) })],
      [rule({ product: 'okra' })],
    )
    expect(list.map((i) => [i.product, i.status])).toEqual([['okra', 'coming_soon']])
  })

  it('takes the soonest of two forecast windows for the same crop', () => {
    const list = items([
      movement({ product: 'lettuce', state: 'forecast', window: { from: '2026-12-10', to: '2026-12-15' } }),
      movement({ product: 'lettuce', state: 'forecast', window: { from: '2026-11-25', to: '2026-11-30' } }),
    ])
    expect(list).toHaveLength(1)
    expect(list[0].expected_from).toBe('2026-11-25')
  })

  it('is case-insensitive about the crop', () => {
    const list = items([movement({ product: 'Okra' })], [rule({ product: 'okra' })])
    expect(list).toHaveLength(1)
    expect(list[0].product).toBe('okra')
  })
})

describe('what is left out', () => {
  it('omits a position below zero — a movement is missing, so neither answer is true', () => {
    const negative = [
      movement({ product: 'okra', amount: { value: 2, unit: 'lb' } }),
      movement({ product: 'okra', kind: 'remove', amount: { value: 9, unit: 'lb' } }),
    ]
    expect(items(negative)).toHaveLength(0)
  })

  it('omits a forecast of nothing', () => {
    expect(items([movement({ product: 'okra', state: 'forecast', kind: 'remove' })])).toHaveLength(0)
  })
})

describe('shape and order', () => {
  it('sends only what the contract names, with quantity, unit, price and variety null', () => {
    const [okra] = items([movement({ product: 'okra', amount: { value: 5, unit: 'lb' }, rawPhrase: 'got 5lb of okra', postedBy: 'user_abc' })])

    expect(() => Item.parse(okra)).not.toThrow()
    expect(okra).toMatchObject({ variety: null, quantity: null, unit: null, price: null })
    expect(JSON.stringify(okra)).not.toMatch(/got 5lb|user_abc/)
  })

  it('orders in season, then coming soon, then gone, then by name — the same every time', () => {
    const list = items(
      [
        movement({ product: 'zucchini' }),
        movement({ product: 'beans' }),
        movement({ product: 'okra', kind: 'remove', occurredAt: ago(1) }),
      ],
      [rule({ product: 'melon' })],
    )
    expect(list.map((i) => `${i.status}:${i.product}`)).toEqual([
      'in_season:beans',
      'in_season:zucchini',
      'coming_soon:melon',
      'gone:okra',
    ])
  })
})

describe('farmLastUpdated', () => {
  it('is the last thing the farm said about anything, including what it sold out of', () => {
    const balances = balancesFrom(
      [
        movement({ product: 'okra', occurredAt: ago(3) }),
        movement({ product: 'beans', kind: 'remove', occurredAt: ago(1) }),
      ],
      { now: NOW, freshnessDays: 7 },
    )
    expect(farmLastUpdated(balances, [rule({ product: 'x', createdAt: ago(2) })])).toBe(ago(1))
  })

  it('counts a rule, and is null for a farm that has never said anything', () => {
    expect(farmLastUpdated([], [rule({ product: 'x', createdAt: ago(2) })])).toBe(ago(2))
    expect(farmLastUpdated([], [])).toBeNull()
  })
})
