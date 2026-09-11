import { describe, expect, it } from 'vitest'
import { balancesFrom, foldBalance, type FoldOptions } from './index'
import type { KnownBalance, Movement, MovementKind } from './types'

const WEEK = { from: '2026-08-01', to: '2026-08-07' }

/** Builds a confirmed, measured `add` of 50lb tomatoes; override what a test cares about. */
function movement(over: Partial<Movement> = {}): Movement {
  return {
    id: 'm1',
    farmId: 'farm-1',
    product: 'tomatoes',
    kind: 'add',
    amount: { value: 50, unit: 'lb' },
    measured: true,
    window: WEEK,
    state: 'confirmed',
    source: 'farmer',
    sessionId: 'session-1',
    occurredAt: '2026-08-01T09:00:00Z',
    ...over,
  }
}

const AT_NOON: FoldOptions = {
  now: new Date('2026-08-02T12:00:00Z'),
  freshnessDays: 3,
}

/** Folds and narrows, so tests about quantity don't repeat the same guard. */
function knownBalance(movements: Movement[], opts: FoldOptions = AT_NOON): KnownBalance {
  const balance = foldBalance(movements, opts)
  if (balance.status !== 'known') {
    throw new Error(`expected a known balance, got "${balance.status}"`)
  }
  return balance
}

describe('foldBalance', () => {
  it('reports the quantity and unit from a single add', () => {
    const balance = knownBalance([movement()])

    expect(balance.quantity).toBe(50)
    expect(balance.unit).toBe('lb')
  })

  it('subtracts a remove from the running total', () => {
    // He had 50lb, then sold 20 at market.
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'add', amount: { value: 50, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 20, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(30)
  })

  it('resets the balance to a trueup, discarding accumulated arithmetic', () => {
    // 50lb, sold "about half", added 20 more — the arithmetic says roughly 45.
    // Then he weighs everything and says 50.6. The measurement wins outright.
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'add', amount: { value: 50, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 25, unit: 'lb' },
        measured: false,
        occurredAt: '2026-08-01T17:00:00Z',
      }),
      movement({
        id: 'm3',
        kind: 'add',
        amount: { value: 20, unit: 'lb' },
        occurredAt: '2026-08-02T08:00:00Z',
      }),
      movement({
        id: 'm4',
        kind: 'trueup',
        amount: { value: 50.6, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(50.6)
  })

  it('treats spoilage as a reduction', () => {
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'add', amount: { value: 40, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        reason: 'spoiled',
        amount: { value: 15, unit: 'lb' },
        occurredAt: '2026-08-02T08:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(25)
  })

  it('counts estimated movements as estimate debt', () => {
    // Weighed once, then two guesses on top of it.
    const balance = knownBalance([
      movement({ id: 'm1', measured: true }),
      movement({
        id: 'm2',
        kind: 'remove',
        measured: false,
        occurredAt: '2026-08-01T17:00:00Z',
      }),
      movement({
        id: 'm3',
        kind: 'add',
        measured: false,
        occurredAt: '2026-08-02T08:00:00Z',
      }),
    ])

    expect(balance.estimateDebt).toBe(2)
  })

  it('clears estimate debt when he weighs everything', () => {
    // Two guesses, then an actual measurement. The drift is gone, not just smaller.
    const balance = knownBalance([
      movement({ id: 'm1', measured: false }),
      movement({
        id: 'm2',
        kind: 'remove',
        measured: false,
        occurredAt: '2026-08-01T17:00:00Z',
      }),
      movement({
        id: 'm3',
        kind: 'trueup',
        measured: true,
        amount: { value: 50.6, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.estimateDebt).toBe(0)
  })

  it('folds in chronological order regardless of the order supplied', () => {
    // The trueup happened first; he added 20 the next day. Storage may hand
    // these back in any order, and a trueup applied last would wipe the add.
    const balance = knownBalance([
      movement({
        id: 'm2',
        kind: 'add',
        amount: { value: 20, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
      movement({
        id: 'm1',
        kind: 'trueup',
        amount: { value: 50, unit: 'lb' },
        occurredAt: '2026-08-01T09:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(70)
  })

  it('lapses once the freshness window has passed', () => {
    // Confirmed on the 1st, greens stay true for 3 days, someone looks on the 6th.
    const balance = knownBalance([movement({ occurredAt: '2026-08-01T09:00:00Z' })], {
      now: new Date('2026-08-06T09:00:00Z'),
      freshnessDays: 3,
    })

    expect(balance.live).toBe(false)
    expect(balance.expiresAt).toBe('2026-08-04T09:00:00.000Z')
  })

  it('stays live inside the freshness window', () => {
    // The complement of the test above — without this, `live: false` always would pass.
    const balance = knownBalance([movement({ occurredAt: '2026-08-01T09:00:00Z' })], {
      now: new Date('2026-08-02T09:00:00Z'),
      freshnessDays: 3,
    })

    expect(balance.live).toBe(true)
  })

  it('never goes live on a forecast alone', () => {
    // "About 30lb ready next week" is a claim about a future window. It must not
    // make the farm look like it has 30lb today.
    const balance = knownBalance([
      movement({
        state: 'forecast',
        amount: { value: 30, unit: 'lb' },
        window: { from: '2026-08-08', to: '2026-08-14' },
      }),
    ])

    expect(balance.live).toBe(false)
    expect(balance.confirmedAt).toBeNull()
  })

  it('reports presence without a figure when he never gave one', () => {
    // "I've got collards" — no number, and none was ever given.
    const balance = foldBalance([movement({ amount: undefined })], AT_NOON)

    expect(balance.status).toBe('present')
    expect(balance.live).toBe(true)
  })

  it('lets a presence-only claim refresh confirmation without disturbing the figure', () => {
    // 40lb on the 1st. On the 2nd he just says "still got collards" — that says
    // he still has some, not how many, so the number must survive untouched.
    const balance = knownBalance([
      movement({
        id: 'm1',
        kind: 'trueup',
        amount: { value: 40, unit: 'lb' },
        occurredAt: '2026-08-01T09:00:00Z',
      }),
      movement({
        id: 'm2',
        kind: 'trueup',
        amount: undefined,
        occurredAt: '2026-08-02T11:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(40)
    expect(balance.confirmedAt).toBe('2026-08-02T11:00:00Z')
  })

  it('preserves a negative balance rather than clamping it', () => {
    // Selling more than he had means a movement is missing. A zero would hide
    // the error; the read-back shows the total, so he can catch it.
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 20, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 30, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(-10)
  })

  it('records when the figure was last actually measured', () => {
    // The public annotation degrades with time since a real measurement
    // ("not weighed in 3 weeks"), so the fold has to carry that timestamp.
    const balance = knownBalance([
      movement({ id: 'm1', measured: false, occurredAt: '2026-08-01T09:00:00Z' }),
      movement({
        id: 'm2',
        kind: 'trueup',
        measured: true,
        amount: { value: 50, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.lastMeasuredAt).toBe('2026-08-02T09:00:00Z')
  })

  it('has never been measured when every movement was a guess', () => {
    const balance = knownBalance([movement({ measured: false })])

    expect(balance.lastMeasuredAt).toBeNull()
  })

  it('refuses to invent a quantity when units disagree', () => {
    // He said 50 pounds, then sold "2 boxes". These are the same tomatoes counted
    // two ways and there is no conversion — so there is no honest number to publish.
    const balance = foldBalance(
      [
        movement({ id: 'm1', amount: { value: 50, unit: 'lb' } }),
        movement({
          id: 'm2',
          kind: 'remove',
          amount: { value: 2, unit: 'box' },
          occurredAt: '2026-08-02T09:00:00Z',
        }),
      ],
      AT_NOON,
    )

    expect(balance.status).toBe('unit-conflict')
    if (balance.status !== 'unit-conflict') return
    expect(balance.units).toEqual(['lb', 'box'])
  })
})

describe('balancesFrom', () => {
  it('gives one balance per product and window', () => {
    // A whole farm's movements arrive as one flat list; positions are per crop.
    const balances = balancesFrom(
      [
        movement({ id: 'm1', product: 'tomatoes', amount: { value: 40, unit: 'lb' } }),
        movement({ id: 'm2', product: 'collards', amount: { value: 20, unit: 'bunch' } }),
        movement({
          id: 'm3',
          product: 'tomatoes',
          kind: 'remove',
          amount: { value: 10, unit: 'lb' },
          occurredAt: '2026-08-02T09:00:00Z',
        }),
      ],
      AT_NOON,
    )

    expect(balances).toHaveLength(2)

    const tomatoes = balances.find((entry) => entry.product === 'tomatoes')
    expect(tomatoes?.balance.status).toBe('known')
    if (tomatoes?.balance.status === 'known') {
      expect(tomatoes.balance.quantity).toBe(30)
    }
  })

  it('keeps a future window separate from the current one', () => {
    // "About 30lb ready next week" is a different position, not more tomatoes today.
    const balances = balancesFrom(
      [
        movement({ id: 'm1', product: 'tomatoes', amount: { value: 40, unit: 'lb' } }),
        movement({
          id: 'm2',
          product: 'tomatoes',
          state: 'forecast',
          amount: { value: 30, unit: 'lb' },
          window: { from: '2026-08-08', to: '2026-08-14' },
        }),
      ],
      AT_NOON,
    )

    expect(balances).toHaveLength(2)
  })
})

describe('per-product freshness', () => {
  it('gives each product its own window', () => {
    // Salad greens go in days; winter squash sits for months. Both confirmed on
    // the 1st, looked at on the 5th — the greens should be gone, the squash not.
    const balances = balancesFrom(
      [
        movement({ id: 'm1', product: 'greens', amount: { value: 10, unit: 'bunch' } }),
        movement({ id: 'm2', product: 'squash', amount: { value: 10, unit: 'lb' } }),
      ],
      {
        now: new Date('2026-08-05T09:00:00Z'),
        freshnessDays: 30,
        freshnessByProduct: { greens: 2 },
      },
    )

    const live = (product: string) =>
      balances.find((entry) => entry.product === product)?.balance.live

    expect(live('greens')).toBe(false)
    expect(live('squash')).toBe(true)
  })
})

describe('current stock is not weekly', () => {
  it('keeps one position no matter when he says things', () => {
    // Sunday and the following Thursday are the same tomatoes. Nothing about
    // current stock is periodic — only a claim about a future demand event is.
    const balances = balancesFrom(
      [
        movement({
          id: 'm1',
          window: undefined,
          kind: 'trueup',
          amount: { value: 40, unit: 'lb' },
          occurredAt: '2026-08-02T09:00:00Z',
        }),
        movement({
          id: 'm2',
          window: undefined,
          kind: 'add',
          amount: { value: 10, unit: 'lb' },
          occurredAt: '2026-08-06T09:00:00Z',
        }),
      ],
      { now: new Date('2026-08-06T12:00:00Z'), freshnessDays: 5 },
    )

    expect(balances).toHaveLength(1)
    const [only] = balances
    expect(only.balance.status === 'known' && only.balance.quantity).toBe(50)
  })

  it('still separates a claim about a future window', () => {
    const balances = balancesFrom(
      [
        movement({ id: 'm1', window: undefined, amount: { value: 40, unit: 'lb' } }),
        movement({
          id: 'm2',
          state: 'forecast',
          window: { from: '2026-09-01', to: '2026-09-07' },
          amount: { value: 300, unit: 'lb' },
        }),
      ],
      AT_NOON,
    )

    expect(balances).toHaveLength(2)
  })
})

/**
 * "I'll have head lettuce in about two weeks" — from the beta, with no dates in
 * it. A forecast without a window used to share a bucket with current stock,
 * so an expected harvest could be added to what he actually had.
 */
describe('an undated forecast', () => {
  const undated = (over: Partial<Movement> = {}): Movement => ({
    id: 'f1',
    farmId: 'farm',
    product: 'head lettuce',
    kind: 'trueup',
    measured: false,
    state: 'forecast',
    source: 'farmer',
    sessionId: 's',
    occurredAt: '2026-09-01T20:34:00Z',
    ...over,
  })

  const opts = { now: new Date('2026-09-02T12:00:00Z'), freshnessDays: 7 }

  it('is its own position, never folded into stock on hand', () => {
    const balances = balancesFrom(
      [
        undated({ id: 'f1', amount: { value: 30, unit: 'count' } }),
        undated({
          id: 'c1',
          state: 'confirmed',
          amount: { value: 12, unit: 'count' },
          occurredAt: '2026-09-02T09:00:00Z',
        }),
      ],
      opts,
    )

    expect(balances).toHaveLength(2)
    const onHand = balances.find((b) => !b.forecast)
    const coming = balances.find((b) => b.forecast)
    expect(onHand?.balance).toMatchObject({ status: 'known', quantity: 12 })
    expect(coming?.balance).toMatchObject({ status: 'known', quantity: 30 })
  })

  it('is marked as a forecast even with no window', () => {
    const [balance] = balancesFrom([undated()], opts)
    expect(balance.forecast).toBe(true)
    expect(balance.window).toBeUndefined()
  })

  it('never goes live, so it cannot read as available', () => {
    const [balance] = balancesFrom([undated()], opts)
    expect(balance.balance.live).toBe(false)
  })
})

/**
 * "Deer ate them" carries no number, because that is how the sentence is
 * spoken. The presence rule above — no amount means he still has some — was
 * written for "I've got collards" and reading a removal that way left the
 * figure standing and the clock freshly reset, so the crop came back stronger
 * than before (ADR 0002).
 */
describe('a position he has emptied', () => {
  it('empties a position that had a figure when he gives no number', () => {
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: undefined,
        reason: 'wildlife',
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ], AT_NOON)

    expect(balance.status).toBe('none')
  })

  it('empties a position that never had a figure at all', () => {
    // Most of the farm is like this: "I've got collards", and then they're gone.
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: undefined }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: undefined,
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ], AT_NOON)

    expect(balance.status).toBe('none')
  })

  it('fills up again when he picks more', () => {
    // Emptying is not sticky: the deer got them, then he picked on Friday.
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: undefined,
        reason: 'wildlife',
        occurredAt: '2026-08-02T09:00:00Z',
      }),
      movement({
        id: 'm3',
        kind: 'add',
        amount: { value: 20, unit: 'lb' },
        occurredAt: '2026-08-02T10:00:00Z',
      }),
    ])

    // 20, not 30: what he emptied does not come back with the new pick.
    expect(balance.quantity).toBe(20)
  })

  it('is present again when he says he has some without a number', () => {
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: undefined }),
      movement({ id: 'm2', kind: 'remove', amount: undefined, occurredAt: '2026-08-02T09:00:00Z' }),
      movement({ id: 'm3', kind: 'trueup', amount: undefined, occurredAt: '2026-08-02T10:00:00Z' }),
    ], AT_NOON)

    expect(balance.status).toBe('present')
  })

  it('still subtracts when he does give a number', () => {
    const balance = knownBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 4, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(balance.quantity).toBe(6)
  })

  it('escapes a unit conflict, because he has said there is nothing to total', () => {
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'add',
        amount: { value: 2, unit: 'box' },
        occurredAt: '2026-08-02T08:00:00Z',
      }),
      movement({ id: 'm3', kind: 'remove', amount: undefined, occurredAt: '2026-08-02T09:00:00Z' }),
    ], AT_NOON)

    expect(balance.status).toBe('none')
  })

  it('counts as him having spoken, like any other claim', () => {
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({ id: 'm2', kind: 'remove', amount: undefined, occurredAt: '2026-08-02T09:00:00Z' }),
    ], AT_NOON)

    expect(balance.confirmedAt).toBe('2026-08-02T09:00:00Z')
  })

  it('reduces on a movement written before spoil was a reason rather than a kind', () => {
    // Old rows exist. A kind the fold no longer names must still take stock out
    // rather than fall through and leave it standing.
    const balance = foldBalance([
      movement({ id: 'm1', kind: 'trueup', amount: { value: 10, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'spoil' as MovementKind,
        amount: { value: 4, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ], AT_NOON)

    expect(balance.status === 'known' && balance.quantity).toBe(6)
  })
})
