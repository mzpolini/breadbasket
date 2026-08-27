import { WEEKLY, type HarvestRule } from '../cadence'
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

/**
 * The public page cannot render without this, and there is no farm-profile
 * model yet — noted as a gap when the design came back. Placeholder shape.
 */
export const SEED_FARM = {
  id: SEED_FARM_ID,
  name: 'Mighty Thundercloud',
  tagline: 'Edible Forest · Maryland',
  market: 'at the market Saturdays, 8–1',
  /** Drop a real file here and it renders instead of the initial. */
  logo: '/brand/logo.png',
}

/** v0.1 identity: one farm behind one secret URL. No login, nothing to remember. */
export const SEED_FARM_SECRET = 'seed-farm-preview'

/**
 * The freshness window: how long anything he says stays trusted before it is
 * flagged. **Flat seven days, every crop — a temporary POC decision**
 * (NORTHSTAR.md). It is a trust clock (has he checked in?), not a spoilage
 * guess, which is why one number is honest enough for now. Per-crop windows
 * were sketched and deliberately not built.
 */
export const FRESHNESS_DAYS = 7

/**
 * One standing harvest rule, so the stand's "coming soon" and the stock view's
 * standing section have something to show. This is the sentence that broke the
 * first beta.
 */
export function seedHarvestRules(now: Date, farmId: string = SEED_FARM_ID): HarvestRule[] {
  const year = now.getUTCFullYear()
  return [
    {
      id: 'seed-rule-1',
      farmId,
      product: 'watermelon',
      rawPhrase: 'about twenty pounds of watermelon every week through September',
      amount: { value: 20, unit: 'lb' },
      interval: WEEKLY,
      endsOn: `${year}-09-30`,
      ended: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export function seedMovements(now: Date, farmId: string = SEED_FARM_ID): Movement[] {
  const at = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

  // Only the forecast needs a window — current stock has none, so everything he
  // says about it lands in one position however often he says it.
  const nextWeek = { from: at(-5).slice(0, 10), to: at(-11).slice(0, 10) }

  let sequence = 0
  const movement = (over: Partial<Movement> & Pick<Movement, 'product'>): Movement => ({
    id: `seed-${++sequence}`,
    farmId,
    kind: 'trueup',
    measured: false,
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

    // Spoken about 20 days ago: flagged. Still on the stand, visibly stale, and
    // still in his view — or he cannot tell sold-out from forgotten.
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
