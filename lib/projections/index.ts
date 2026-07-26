import type { ProductBalance, Window } from '../ledger'

/**
 * View models. These are the seam a UI binds to — a component consumes a
 * `PublicListing[]` and never touches a movement, a fold, or a `Balance` union.
 *
 * The display rules live here rather than in components so that the two views
 * cannot quietly disagree about what "estimated" or "lapsed" means.
 */

export type Quantity = {
  value: number
  unit: string
}

export type PublicListing = {
  product: string
  /** `null` means he has some and never said how many — render as "available". */
  quantity: Quantity | null
  confidence: 'weighed' | 'estimated'
  /**
   * Weeks since the figure last rested on a real measurement. `null` when it was
   * measured recently or never at all. Renders as the degrading annotation:
   * "estimated · not weighed in 3 weeks".
   */
  weeksSinceMeasured: number | null
  confirmedAt: string
}

export type ProjectionOptions = {
  /** Injected so the projections never read the clock. */
  now: Date
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * What a buyer sees. Only positions we can make an honest claim about:
 *
 * - **lapsed** positions are absent, not greyed — the promise is that what is
 *   listed is actually available
 * - a **unit conflict** publishes as "available" rather than being hidden. He
 *   definitely has tomatoes; we just cannot say how many, and saying "available"
 *   is not a lie while hiding real food helps nobody
 * - a position at **zero or below** is withheld. Sold out is honest and expected;
 *   negative means a movement is missing so we do not know what is there. Neither
 *   is an offer
 */
export function publicListings(
  balances: ProductBalance[],
  opts: ProjectionOptions,
): PublicListing[] {
  return balances.flatMap(({ product, balance }) => {
    // `live` already implies a confirmation, but narrowing on it beats a cast:
    // a cast would hide the day someone changes what `live` means.
    if (!balance.live || balance.confirmedAt === null) return []
    // Sold out is honest; negative is a data error. Neither is an offer, and
    // neither belongs on a page that promises what is listed is available.
    if (balance.status === 'known' && balance.quantity <= 0) return []

    const quantity =
      balance.status === 'known' ? { value: balance.quantity, unit: balance.unit } : null

    return [
      {
        product,
        quantity,
        confidence: balance.estimateDebt === 0 ? ('weighed' as const) : ('estimated' as const),
        weeksSinceMeasured: weeksSince(balance.lastMeasuredAt, opts.now),
        confirmedAt: balance.confirmedAt,
      },
    ]
  })
}

/** Something he should look at. Never shown to a buyer. */
export type Attention = 'unit-conflict' | 'negative' | 'needs-weighing'

export type InventoryRow = {
  product: string
  /** Kept even when negative — he needs to see the wrong number to fix it. */
  quantity: Quantity | null
  confidence: 'weighed' | 'estimated'
  weeksSinceMeasured: number | null
  confirmedAt: string | null
  expiresAt: string | null
  /** Lapsed rows stay in his view; only the public page drops them. */
  live: boolean
  window: Window
  attention: Attention | null
}

export type InventoryOptions = ProjectionOptions & {
  /**
   * How many guesses may stack before we suggest a stocktake. The founder's
   * number to set — a parameter, never a rule.
   */
  weighAfterEstimates?: number
}

const DEFAULT_WEIGH_AFTER = 3

/**
 * What he sees. Everything the public view shows plus everything it hides:
 * lapsed positions, so he can tell "sold out" from "you forgot to tell me",
 * and the problems worth his attention.
 */
export function farmerInventory(
  balances: ProductBalance[],
  opts: InventoryOptions,
): InventoryRow[] {
  const threshold = opts.weighAfterEstimates ?? DEFAULT_WEIGH_AFTER

  return balances.map(({ product, window, balance }) => ({
    product,
    quantity:
      balance.status === 'known' ? { value: balance.quantity, unit: balance.unit } : null,
    confidence: balance.estimateDebt === 0 ? 'weighed' : 'estimated',
    weeksSinceMeasured: weeksSince(balance.lastMeasuredAt, opts.now),
    confirmedAt: balance.confirmedAt,
    expiresAt: balance.expiresAt,
    live: balance.live,
    window,
    attention: attentionFor(balance, threshold),
  }))
}

function attentionFor(
  balance: ProductBalance['balance'],
  weighAfterEstimates: number,
): Attention | null {
  if (balance.status === 'unit-conflict') return 'unit-conflict'
  if (balance.status === 'known' && balance.quantity < 0) return 'negative'
  if (balance.estimateDebt >= weighAfterEstimates) return 'needs-weighing'
  return null
}

/**
 * Whole weeks only, and `null` under one week — "not weighed in 0 weeks" is
 * noise, and the annotation is meant to accumulate visibly rather than nag.
 */
function weeksSince(measuredAt: string | null, now: Date): number | null {
  if (measuredAt === null) return null

  const weeks = Math.floor((now.getTime() - Date.parse(measuredAt)) / MS_PER_WEEK)
  return weeks < 1 ? null : weeks
}
