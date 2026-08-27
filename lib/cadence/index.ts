import type { HarvestRule } from './types'

export type { HarvestRule } from './types'
export { WEEKLY } from './types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type RuleOptions = {
  /** Injected so nothing here reads the clock. */
  now: Date
  /** Days without the farmer mentioning the crop before the rule is flagged. */
  freshnessDays: number
}

/**
 * A rule as the surfaces see it: current, and either fresh or flagged.
 *
 * `flagged` uses the same freshness window as stock — a rule he hasn't spoken
 * about in a week is shown stale, exactly like a position would be. It never
 * hides the rule; only an explicit end does that.
 */
export type ActiveRule = HarvestRule & {
  /** Whole days since he last spoke about this rule. */
  daysSinceSpoken: number
  flagged: boolean
}

/**
 * The rules that currently stand, one per product.
 *
 * Resolution is "newest wins": any rule that has been superseded is dropped,
 * then any rule that is an explicit end, then any rule whose `endsOn` has
 * passed. Two un-superseded rules for the same product — which can happen if
 * a read-back was published twice — resolve to the newer one, so a customer
 * never sees the same crop listed twice.
 */
export function activeRules(rules: HarvestRule[], opts: RuleOptions): ActiveRule[] {
  const superseded = new Set(rules.flatMap((r) => (r.supersedesId ? [r.supersedesId] : [])))
  const today = isoDate(opts.now)

  const latestPerProduct = new Map<string, HarvestRule>()
  for (const rule of [...rules].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (superseded.has(rule.id)) continue
    latestPerProduct.set(rule.product, rule)
  }

  return [...latestPerProduct.values()]
    .filter((rule) => !rule.ended)
    .filter((rule) => !rule.endsOn || rule.endsOn >= today)
    .map((rule) => {
      const daysSinceSpoken = Math.floor(
        (opts.now.getTime() - Date.parse(rule.createdAt)) / MS_PER_DAY,
      )
      return { ...rule, daysSinceSpoken, flagged: daysSinceSpoken >= opts.freshnessDays }
    })
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
