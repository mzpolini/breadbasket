import type { Movement } from '../ledger'

/**
 * A worked example of the seed farm, generated relative to now so the pages
 * always show live data rather than a fossil.
 *
 * Deliberately exercises **every state a position can be in**, because the
 * interesting ones — a unit conflict, a sold-out zero, a stale measurement —
 * are exactly the ones a hand-written happy path never shows you.
 *
 * Placeholder until real movements exist. Nothing here is the founder's actual
 * farm; the crops are drawn from the conversation transcripts.
 */

export const SEED_FARM_ID = 'seed-farm'

/** v0.1 identity: one farm behind one secret URL. No login, nothing to remember. */
export const SEED_FARM_SECRET = 'seed-farm-preview'

/**
 * How long each crop stays true. Placeholders — these are the founder's numbers
 * to set, and they are values precisely so his answer needs no code change.
 */
export const SEED_FRESHNESS: Record<string, number> = {
  'collard greens': 3,
  'mustard greens': 3,
  tomatoes: 5,
  peaches: 4,
  'summer squash': 7,
  watermelon: 10,
  'sweet potatoes': 60,
}

export const SEED_FRESHNESS_DEFAULT = 7

export function seedMovements(now: Date): Movement[] {
  const at = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

  const thisWeek = { from: at(3).slice(0, 10), to: at(-4).slice(0, 10) }
  const nextWeek = { from: at(-5).slice(0, 10), to: at(-11).slice(0, 10) }

  let sequence = 0
  const movement = (over: Partial<Movement> & Pick<Movement, 'product'>): Movement => ({
    id: `seed-${++sequence}`,
    farmId: SEED_FARM_ID,
    kind: 'trueup',
    measured: false,
    window: thisWeek,
    state: 'confirmed',
    source: 'farmer',
    sessionId: 'seed-session',
    occurredAt: at(1),
    ...over,
  })

  return [
    // Weighed this morning — the trust signal a buyer most wants to see.
    movement({
      product: 'tomatoes',
      amount: { value: 50.6, unit: 'lb' },
      measured: true,
      occurredAt: at(0),
    }),

    // "I've got collards." Presence, no figure, and that is a complete claim.
    movement({ product: 'collard greens', amount: undefined }),

    // Weighed three weeks ago, eyeballed since — the degrading annotation.
    movement({
      product: 'mustard greens',
      amount: { value: 10, unit: 'bunch' },
      measured: true,
      occurredAt: at(22),
    }),
    movement({
      product: 'mustard greens',
      amount: { value: 8, unit: 'bunch' },
      occurredAt: at(1),
    }),

    // Pounds, then boxes. No conversion exists, so no honest number does either.
    movement({ product: 'peaches', amount: { value: 30, unit: 'lb' }, occurredAt: at(2) }),
    movement({
      product: 'peaches',
      kind: 'remove',
      amount: { value: 2, unit: 'box' },
      occurredAt: at(1),
    }),

    // Sold out. Honest, expected, and not an offer.
    movement({
      product: 'summer squash',
      amount: { value: 20, unit: 'lb' },
      occurredAt: at(3),
    }),
    movement({
      product: 'summer squash',
      kind: 'remove',
      amount: { value: 20, unit: 'lb' },
      occurredAt: at(1),
    }),

    // Confirmed 20 days ago against a 10-day window: lapsed, and gone from the
    // public page. He still sees it, or he cannot tell sold-out from forgotten.
    movement({
      product: 'watermelon',
      amount: { value: 200, unit: 'lb' },
      occurredAt: at(20),
    }),

    // "About 300lb ready next week" — a different window, never today's stock.
    movement({
      product: 'sweet potatoes',
      amount: { value: 300, unit: 'lb' },
      state: 'forecast',
      window: nextWeek,
      occurredAt: at(1),
    }),
  ]
}
