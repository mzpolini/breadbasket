import { describe, expect, it } from 'vitest'
import { balancesFrom, type Movement } from '../ledger'
import { farmerInventory, publicListings } from './index'

const WEEK = { from: '2026-08-01', to: '2026-08-07' }

function movement(over: Partial<Movement> = {}): Movement {
  return {
    id: 'm1',
    farmId: 'farm-1',
    product: 'tomatoes',
    kind: 'trueup',
    amount: { value: 40, unit: 'lb' },
    measured: false,
    window: WEEK,
    state: 'confirmed',
    source: 'farmer',
    sessionId: 'session-1',
    occurredAt: '2026-08-01T09:00:00Z',
    ...over,
  }
}

const NOW = new Date('2026-08-02T12:00:00Z')
const opts = { now: NOW, freshnessDays: 3 }

/** Folds movements the way the app will, then projects his own view. */
function inventory(movements: Movement[], at: Date = NOW) {
  return farmerInventory(balancesFrom(movements, { ...opts, now: at }), { now: at })
}

/** Folds movements the way the app will, then projects them. */
function listings(movements: Movement[], at: Date = NOW) {
  return publicListings(balancesFrom(movements, { ...opts, now: at }), { now: at })
}

describe('publicListings', () => {
  it('shows a live position with its figure', () => {
    expect(listings([movement()])).toEqual([
      {
        product: 'tomatoes',
        quantity: { value: 40, unit: 'lb' },
        confidence: 'estimated',
        weeksSinceMeasured: null,
        confirmedAt: '2026-08-01T09:00:00Z',
      },
    ])
  })

  it('omits a lapsed position entirely', () => {
    // Not greyed, not struck through — absent. What a buyer sees is true or gone.
    expect(listings([movement()], new Date('2026-08-09T12:00:00Z'))).toEqual([])
  })

  it('shows a presence-only position as available, with no figure', () => {
    // "I've got collards" is a real claim. A buyer driving out mostly needs to
    // know there are collards.
    const [listing] = listings([movement({ product: 'collards', amount: undefined })])

    expect(listing.product).toBe('collards')
    expect(listing.quantity).toBeNull()
  })

  it('shows a unit conflict as available rather than hiding the food', () => {
    // He said pounds, then boxes. We cannot say how many — but he definitely has
    // tomatoes, and "available" is not a lie while hiding real food helps nobody.
    const [listing] = listings([
      movement({ id: 'm1', amount: { value: 40, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 2, unit: 'box' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(listing.quantity).toBeNull()
  })

  it('withholds a negative position entirely', () => {
    // Sold more than recorded means a movement is missing, so we do not know
    // what is there. There is no honest claim to publish.
    expect(
      listings([
        movement({ id: 'm1', amount: { value: 20, unit: 'lb' } }),
        movement({
          id: 'm2',
          kind: 'remove',
          amount: { value: 30, unit: 'lb' },
          occurredAt: '2026-08-02T09:00:00Z',
        }),
      ]),
    ).toEqual([])
  })

  it('reports weeks since the figure was last actually measured', () => {
    // Weighed three weeks ago, re-confirmed by eye today: still live, but the
    // annotation should say how stale the measurement is.
    const [listing] = listings([
      movement({
        id: 'm1',
        measured: true,
        amount: { value: 40, unit: 'lb' },
        occurredAt: '2026-07-12T09:00:00Z',
      }),
      movement({ id: 'm2', measured: false, occurredAt: '2026-08-01T09:00:00Z' }),
    ])

    expect(listing.confidence).toBe('estimated')
    expect(listing.weeksSinceMeasured).toBe(3)
  })
})

describe('farmerInventory', () => {
  it('keeps a lapsed position visible to him', () => {
    // The public page hides it; he must be able to tell "sold out" from
    // "you forgot to tell me".
    const rows = inventory([movement()], new Date('2026-08-09T12:00:00Z'))

    expect(rows).toHaveLength(1)
    expect(rows[0].live).toBe(false)
  })

  it('flags a unit conflict for him to sort out', () => {
    const [row] = inventory([
      movement({ id: 'm1', amount: { value: 40, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 2, unit: 'box' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(row.attention).toBe('unit-conflict')
  })

  it('flags a negative position, which means a movement is missing', () => {
    const [row] = inventory([
      movement({ id: 'm1', amount: { value: 20, unit: 'lb' } }),
      movement({
        id: 'm2',
        kind: 'remove',
        amount: { value: 30, unit: 'lb' },
        occurredAt: '2026-08-02T09:00:00Z',
      }),
    ])

    expect(row.attention).toBe('negative')
  })

  it('flags a position whose guesses have piled up', () => {
    // Three estimates and no measurement — this is what the stocktake prompt
    // is for, and the threshold is the founder's number to set.
    const [row] = inventory([
      movement({ id: 'm1', measured: false, occurredAt: '2026-08-01T09:00:00Z' }),
      movement({ id: 'm2', kind: 'add', measured: false, occurredAt: '2026-08-01T10:00:00Z' }),
      movement({ id: 'm3', kind: 'add', measured: false, occurredAt: '2026-08-01T11:00:00Z' }),
    ])

    expect(row.attention).toBe('needs-weighing')
  })
})
