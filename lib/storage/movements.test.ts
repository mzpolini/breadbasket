import { describe, expect, it } from 'vitest'
import { COUNT_UNIT, type Movement } from '../ledger'
import { toMovement, toRow } from './movements'

/**
 * The round trip, not the database. A mapping that silently drops `measured` or
 * flattens a window would corrupt every balance downstream while the query
 * itself looks perfectly healthy.
 */

const full: Movement = {
  id: 'm1',
  farmId: 'farm-1',
  product: 'tomatoes',
  rawPhrase: 'about 40lb of tomatoes',
  kind: 'trueup',
  amount: { value: 40.5, unit: 'lb' },
  measured: false,
  window: { from: '2026-08-08', to: '2026-08-14' },
  state: 'forecast',
  source: 'farmer',
  sessionId: 'session-1',
  occurredAt: '2026-08-01T09:00:00.000Z',
}

describe('storage round trip', () => {
  it('preserves every field of a fully populated movement', () => {
    expect(toMovement(toRow(full))).toEqual(full)
  })

  it('preserves a presence-only movement without inventing an amount', () => {
    // "I've got collards" — no number, and none should appear on the way back.
    const presenceOnly: Movement = {
      id: 'm2',
      farmId: 'farm-1',
      product: 'collards',
      kind: 'trueup',
      measured: false,
      state: 'confirmed',
      source: 'farmer',
      sessionId: 'session-1',
      occurredAt: '2026-08-01T09:00:00.000Z',
    }

    const back = toMovement(toRow(presenceOnly))

    expect(back).toEqual(presenceOnly)
    expect('amount' in back).toBe(false)
  })

  it('reads a row with a number but no unit back as a bare count', () => {
    // Rows like this exist from before counts had a unit. The number is the
    // thing he said — losing it silently is worse than any wrong unit label.
    const back = toMovement({
      ...toRow(full),
      amountValue: 12,
      amountUnit: null,
    })

    expect(back.amount).toEqual({ value: 12, unit: COUNT_UNIT })
  })

  it('does not invent a window for current stock', () => {
    // A window would split one position in two at every week boundary.
    const currentStock: Movement = { ...full, window: undefined, state: 'confirmed' }
    const back = toMovement(toRow(currentStock))

    expect('window' in back).toBe(false)
  })
})
