import { describe, expect, it } from 'vitest'
import { balancesFrom, COUNT_UNIT } from '../ledger'
import type { ProposedMovement, ProposedRule } from './tools'
import { soldOut, toMovements, toRules } from './commit'

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
  reason: null,
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
  it('keeps why the stock went', () => {
    const [movement] = toMovements(
      [proposal({ kind: 'remove', reason: 'wildlife', rawPhrase: 'deer ate them' })],
      ctx,
    )
    expect(movement.reason).toBe('wildlife')
  })

  it('leaves a reduction he gave no number for without one, rather than inventing a unit', () => {
    // "The deer got the okra" empties the position. A true-up to zero in a unit
    // he never used would collide with the unit he does speak in, and a crop
    // counted two ways publishes as available — which is how the Sold out
    // button used to leave sold-out crops on the page.
    const [movement] = toMovements(
      [proposal({ kind: 'remove', reason: 'sold', amountValue: null, amountUnit: null })],
      ctx,
    )

    expect(movement.amount).toBeUndefined()
    expect(movement.kind).toBe('remove')
  })

  it('carries no reason when he was not reducing anything', () => {
    const [movement] = toMovements([proposal()], ctx)
    expect(movement.reason).toBeUndefined()
  })

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

  it('records which person published it', () => {
    const [movement] = toMovements([proposal()], { ...ctx, postedBy: 'user_alice' })
    expect(movement.postedBy).toBe('user_alice')
  })

  it('leaves the author off rather than inventing one when there is none', () => {
    const [movement] = toMovements([proposal()], ctx)
    expect(movement).not.toHaveProperty('postedBy')
  })
})

/**
 * Brief item 1, "done when": two people on one farm post, and both see one
 * shared inventory — with each update still traceable to whoever said it.
 */
describe('two people on one farm', () => {
  it('fold into one shared position, each update attributed to its author', () => {
    const alice = toMovements([proposal({ kind: 'trueup', amountValue: 30 })], {
      ...ctx,
      newId: () => 'm-alice',
      postedBy: 'user_alice',
      occurredAt: '2026-07-26T09:00:00.000Z',
    })
    const bob = toMovements([proposal({ kind: 'add', amountValue: 10, rawPhrase: '10 more' })], {
      ...ctx,
      newId: () => 'm-bob',
      postedBy: 'user_bob',
      occurredAt: '2026-07-26T10:00:00.000Z',
    })

    const ledger = [...alice, ...bob]
    expect(ledger.map((m) => [m.farmId, m.postedBy])).toEqual([
      ['farm-1', 'user_alice'],
      ['farm-1', 'user_bob'],
    ])

    const balances = balancesFrom(ledger, {
      now: new Date('2026-07-26T12:00:00.000Z'),
      freshnessDays: 7,
    })
    expect(balances).toHaveLength(1)
    expect(balances[0]).toMatchObject({
      farmId: 'farm-1',
      product: 'tomatoes',
      balance: { status: 'known', quantity: 40 },
    })
  })
})

describe('toRules', () => {
  const rule = (over: Partial<ProposedRule> = {}): ProposedRule =>
    ({
      product: 'Watermelon',
      heardAs: 'melons',
      rawPhrase: 'twenty pounds of watermelon every week',
      amountValue: 20,
      amountUnit: 'lb',
      interval: 'weekly',
      startsOn: null,
      endsOn: null,
      ended: false,
      ...over,
    }) as ProposedRule

  it('records which person published it', () => {
    const [stored] = toRules([rule()], {
      farmId: 'farm-1',
      createdAt: '2026-07-26T09:00:00.000Z',
      newId: () => 'r1',
      currentRuleIdFor: () => undefined,
      postedBy: 'user_bob',
    })
    expect(stored.postedBy).toBe('user_bob')
  })
})

/**
 * The one movement he can write without saying anything — so the only place it
 * can be got wrong is here.
 */
describe('the Sold out button', () => {
  it('empties the crop without inventing a unit for it', () => {
    const [movement] = toMovements([soldOut('red okra')], ctx)

    expect(movement.kind).toBe('remove')
    expect(movement.reason).toBe('sold')
    expect(movement.amount).toBeUndefined()
  })

  it('is a claim about now, from him, like any other', () => {
    const [movement] = toMovements([soldOut('red okra')], ctx)

    expect(movement.state).toBe('confirmed')
    expect(movement.source).toBe('farmer')
    expect(movement.measured).toBe(false)
  })
})
