import { describe, expect, it } from 'vitest'
import { foldBalance, type FoldOptions } from './index'
import type { KnownBalance, Movement } from './types'

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
        kind: 'spoil',
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
