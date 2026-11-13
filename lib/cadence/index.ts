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
 * `flagged` never hides a rule; only an explicit end does that. And a rule that
 * **named the date it runs to** is not flagged before that date (ADR 0004) — the
 * flag asks "is this still on?", and he has already answered for the period he
 * named. Only an open-ended rule ages the way stock does.
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
      // `endsOn` survives the filter above only when it is still ahead of us, so
      // its presence here means he has spoken for today already. Days are
      // counted either way: the agent still wants to know how long it has been.
      const stale = daysSinceSpoken >= opts.freshnessDays

      return { ...rule, daysSinceSpoken, flagged: stale && !rule.endsOn }
    })
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
