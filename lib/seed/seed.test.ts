import { describe, expect, it } from 'vitest'
import { balancesFrom } from '../ledger'
import { farmerInventory, publicListings } from '../projections'
import { SEED_FRESHNESS, SEED_FRESHNESS_DEFAULT, seedMovements } from './index'

/**
 * The seed exists to exercise every state a position can be in — the awkward
 * ones especially, since a hand-written happy path never shows them. If an edit
 * quietly drops the unit conflict or the sold-out row, the scaffolding pages
 * stop demonstrating what they were built to demonstrate.
 */

const NOW = new Date('2026-08-20T12:00:00Z')

const balances = () =>
  balancesFrom(seedMovements(NOW), {
    now: NOW,
    freshnessDays: SEED_FRESHNESS_DEFAULT,
    freshnessByProduct: SEED_FRESHNESS,
  })

describe('the seed farm', () => {
  it('publishes only what can be honestly claimed', () => {
    const products = publicListings(balances(), { now: NOW }).map((l) => l.product).sort()

    // Sold out (squash), lapsed (watermelon) and still-to-come (sweet potatoes)
    // are all absent — three different reasons, one consistent promise.
    expect(products).toEqual(['collard greens', 'mustard greens', 'peaches', 'tomatoes'])
  })

  it('shows a weighed figure, an unquantified one, and a stale measurement', () => {
    const listings = publicListings(balances(), { now: NOW })
    const of = (product: string) => listings.find((l) => l.product === product)

    expect(of('tomatoes')?.confidence).toBe('weighed')
    expect(of('collard greens')?.quantity).toBeNull()
    expect(of('mustard greens')?.weeksSinceMeasured).toBe(3)
  })

  it('publishes a unit conflict as available rather than hiding the food', () => {
    const peaches = publicListings(balances(), { now: NOW }).find(
      (l) => l.product === 'peaches',
    )

    expect(peaches?.quantity).toBeNull()
  })

  it('keeps what buyers cannot see in his own view, and flags what needs him', () => {
    const rows = farmerInventory(balances(), { now: NOW })
    const of = (product: string) => rows.find((r) => r.product === product)

    expect(of('watermelon')?.live).toBe(false)
    expect(of('summer squash')?.quantity?.value).toBe(0)
    expect(of('sweet potatoes')?.live).toBe(false)
    expect(of('peaches')?.attention).toBe('unit-conflict')
  })
})
