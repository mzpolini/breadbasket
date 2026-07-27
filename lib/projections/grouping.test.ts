import { describe, expect, it } from 'vitest'
import { groupInventory, type InventoryRow } from './index'

/**
 * The order of a farmer's attention, from design `1d`.
 *
 * The grouping *is* the design: what needs him first, what is quietly fine
 * second, what buyers can't see at all last. Getting a row into the wrong group
 * is worse than a wrong number, because he stops trusting the sections.
 */

const NOW = new Date('2026-08-02T12:00:00Z')
const inHours = (h: number) => new Date(NOW.getTime() + h * 60 * 60 * 1000).toISOString()

function row(over: Partial<InventoryRow> = {}): InventoryRow {
  return {
    product: 'tomatoes',
    quantity: { value: 40, unit: 'lb' },
    confidence: 'estimated',
    weeksSinceMeasured: null,
    confirmedAt: '2026-08-01T09:00:00Z',
    expiresAt: inHours(120),
    live: true,
    attention: null,
    ...over,
  }
}

const group = (rows: InventoryRow[]) => groupInventory(rows, { now: NOW })

describe('groupInventory', () => {
  it('leaves a healthy live crop alone', () => {
    const { live, expiringSoon } = group([row()])
    expect(live.map((r) => r.product)).toEqual(['tomatoes'])
    expect(expiringSoon).toEqual([])
  })

  it('pulls out a crop about to drop off his page', () => {
    const { expiringSoon, live } = group([row({ expiresAt: inHours(20) })])
    expect(expiringSoon.map((r) => r.product)).toEqual(['tomatoes'])
    expect(live).toEqual([])
  })

  it('does not treat a crop with days left as expiring', () => {
    expect(group([row({ expiresAt: inHours(60) })]).expiringSoon).toEqual([])
  })

  it('groups a crop counted two ways as something it cannot total', () => {
    const { cantTotal, live } = group([row({ attention: 'unit-conflict' })])
    expect(cantTotal.map((r) => r.product)).toEqual(['tomatoes'])
    expect(live).toEqual([])
  })

  it('groups a below-zero crop the same way — both are arithmetic he must settle', () => {
    expect(group([row({ attention: 'negative' })]).cantTotal).toHaveLength(1)
  })

  it('leaves a crop that merely needs weighing in live — that is an annotation, not a blocker', () => {
    const { live, cantTotal } = group([row({ attention: 'needs-weighing' })])
    expect(live).toHaveLength(1)
    expect(cantTotal).toEqual([])
  })

  it('separates lapsed crops, which buyers can no longer see', () => {
    const { lapsed, live } = group([row({ live: false })])
    expect(lapsed.map((r) => r.product)).toEqual(['tomatoes'])
    expect(live).toEqual([])
  })

  it('keeps forecasts out of every stock group', () => {
    const { forecast, live, lapsed } = group([
      row({ window: { from: '2026-08-08', to: '2026-08-14' } }),
    ])
    expect(forecast).toHaveLength(1)
    expect(live).toEqual([])
    expect(lapsed).toEqual([])
  })

  it('ranks a forecast above every other reason to group it', () => {
    // A forecast that has also lapsed is still a forecast — it was never stock.
    const { forecast, lapsed } = group([
      row({ window: { from: '2026-08-08', to: '2026-08-14' }, live: false }),
    ])
    expect(forecast).toHaveLength(1)
    expect(lapsed).toEqual([])
  })

  it('ranks something it cannot total above lapsing — the arithmetic outlives the expiry', () => {
    const { cantTotal, lapsed } = group([row({ attention: 'unit-conflict', live: false })])
    expect(cantTotal).toHaveLength(1)
    expect(lapsed).toEqual([])
  })

  it('puts every row in exactly one group', () => {
    const rows = [
      row({ product: 'a' }),
      row({ product: 'b', expiresAt: inHours(5) }),
      row({ product: 'c', attention: 'negative' }),
      row({ product: 'd', live: false }),
      row({ product: 'e', window: { from: '2026-08-08', to: '2026-08-14' } }),
    ]
    const grouped = group(rows)
    const all = [
      ...grouped.expiringSoon,
      ...grouped.live,
      ...grouped.cantTotal,
      ...grouped.lapsed,
      ...grouped.forecast,
    ]
    expect(all).toHaveLength(rows.length)
    expect(new Set(all.map((r) => r.product)).size).toBe(rows.length)
  })

  it('treats a crop with no expiry as live rather than expiring', () => {
    expect(group([row({ expiresAt: null })]).live).toHaveLength(1)
  })
})
