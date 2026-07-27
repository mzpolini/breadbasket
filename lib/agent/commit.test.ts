import { describe, expect, it } from 'vitest'
import { COUNT_UNIT } from '../ledger'
import type { ProposedMovement } from './tools'
import { toMovements } from './commit'

/**
 * The seam where the model's proposal becomes a fact.
 *
 * These tests exist because of a real bug: a bare count — "thirty tomatoes",
 * with a number but no unit word — reached the ledger with its number stripped,
 * so the farmer's stock page said "he has some" for crops he had just counted
 * out loud. Anything that loses a number he actually said belongs here.
 */

const proposal = (over: Partial<ProposedMovement> = {}): ProposedMovement => ({
  product: 'tomatoes',
  heardAs: 'maters',
  rawPhrase: 'about 30 maters',
  kind: 'trueup',
  amountValue: 30,
  amountUnit: 'lb',
  measured: false,
  forecast: false,
  windowFrom: null,
  windowTo: null,
  ...over,
})

const ctx = {
  farmId: 'farm-1',
  sessionId: 'session-1',
  occurredAt: '2026-07-26T09:00:00.000Z',
  newId: () => 'id-1',
}

describe('toMovements', () => {
  it('keeps the number when he gave a unit', () => {
    const [movement] = toMovements([proposal()], ctx)
    expect(movement.amount).toEqual({ value: 30, unit: 'lb' })
  })

  it('keeps the number when he gave no unit — a bare count is still a count', () => {
    const [movement] = toMovements([proposal({ amountValue: 12, amountUnit: null })], ctx)
    expect(movement.amount).toEqual({ value: 12, unit: COUNT_UNIT })
  })

  it('treats a blank unit as a bare count rather than a unit named ""', () => {
    const [movement] = toMovements([proposal({ amountValue: 12, amountUnit: '  ' })], ctx)
    expect(movement.amount).toEqual({ value: 12, unit: COUNT_UNIT })
  })

  it('records no amount at all when he gave no number', () => {
    const [movement] = toMovements([proposal({ amountValue: null, amountUnit: 'lb' })], ctx)
    expect(movement.amount).toBeUndefined()
  })

  it('cannot be measured without a number, whatever the model claimed', () => {
    const [movement] = toMovements([proposal({ amountValue: null, measured: true })], ctx)
    expect(movement.measured).toBe(false)
  })

  it('keeps measured true when he did give a number', () => {
    const [movement] = toMovements([proposal({ measured: true })], ctx)
    expect(movement.measured).toBe(true)
  })

  it('normalises the product so "Tomatoes " and "tomatoes" are one position', () => {
    const [movement] = toMovements([proposal({ product: '  Tomatoes ' })], ctx)
    expect(movement.product).toBe('tomatoes')
  })

  it('keeps the unit as he says it, only trimmed — units are his vocabulary', () => {
    const [movement] = toMovements([proposal({ amountUnit: ' Bunches ' })], ctx)
    expect(movement.amount).toEqual({ value: 30, unit: 'Bunches' })
  })

  it('carries a forecast window through and marks the state', () => {
    const [movement] = toMovements(
      [proposal({ forecast: true, windowFrom: '2026-08-01', windowTo: '2026-08-07' })],
      ctx,
    )
    expect(movement.state).toBe('forecast')
    expect(movement.window).toEqual({ from: '2026-08-01', to: '2026-08-07' })
  })

  it('refuses a forecast window with only one end — a half window is not a period', () => {
    const [movement] = toMovements([proposal({ forecast: true, windowFrom: '2026-08-01' })], ctx)
    expect(movement.window).toBeUndefined()
  })

  it('gives current stock no window, so week boundaries cannot split a position', () => {
    const [movement] = toMovements([proposal()], ctx)
    expect(movement.window).toBeUndefined()
  })

  it('stamps one session and one timestamp across the whole batch', () => {
    const movements = toMovements([proposal(), proposal({ product: 'peaches' })], ctx)
    expect(movements.map((m) => m.sessionId)).toEqual(['session-1', 'session-1'])
    expect(movements.map((m) => m.occurredAt)).toEqual([ctx.occurredAt, ctx.occurredAt])
  })

  it('attributes it to the farmer — nothing else can reach this path yet', () => {
    const [movement] = toMovements([proposal()], ctx)
    expect(movement.source).toBe('farmer')
    expect(movement.farmId).toBe('farm-1')
  })
})
