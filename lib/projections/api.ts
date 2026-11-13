import type { Item } from '../api/contract'
import { activeRules, type HarvestRule } from '../cadence'
import type { ProductBalance } from '../ledger'

/**
 * What the directory is told — the read API's view of one farm.
 *
 * Built from the same folds as the farm stand (`balancesFrom`, `activeRules`),
 * never from a second reading of the ledger, so the two can disagree only where
 * they are meant to: the stand keeps a stale item on the page, greyed, as the
 * farmer's reminder to check in; a map pin has no greying, so after
 * `goneAfterDays` of silence this reports the item `gone` (ticket 42, option A).
 *
 * Objects are built field by field. A position's own fields never pass through,
 * so a column added to a table can't leak into a response — and the route
 * parses the result against the contract before it is sent.
 */

export type ApiItemOptions = {
  /** Injected so nothing here reads the clock. */
  now: Date
  /** Days of silence after which an item reads `gone`. See `lib/settings`. */
  goneAfterDays: number
}

/** A `gone` item stays in the response this long, so a consumer can take its pin down. */
export const GONE_REPORTED_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Lower is shown first: what is here, then what is coming, then what went. */
const ORDER = { in_season: 0, coming_soon: 1, gone: 2 } as const

/**
 * One item per crop, ordered the same way every time.
 *
 * - `in_season` — on hand, not *none left*, and not silent for `goneAfterDays`.
 *   `available_until` is a standing rule's end date, if the farm has one.
 * - `coming_soon` — a standing harvest rule, or a one-off forecast: dated, until
 *   its window ends; undated, until `goneAfterDays` of silence. Never stock.
 * - `gone` — *none left* (he said so), sold out to zero, or silent for
 *   `goneAfterDays`. Reported for `GONE_REPORTED_DAYS` after it goes, then omitted.
 *
 * A crop appears **once**, at the most useful of its statuses: in season over
 * coming soon over gone. "No tomatoes today, twenty pounds a week from
 * Thursday" is `coming_soon`, not two pins.
 *
 * A position below zero is left out: a movement is missing, so we don't know
 * what is there, and neither "here" nor "gone" would be true.
 *
 * The order is deterministic because the response's ETag is a hash of it.
 */
export function apiItems(
  balances: ProductBalance[],
  rules: HarvestRule[],
  opts: ApiItemOptions,
): Item[] {
  const { now, goneAfterDays } = opts
  const today = now.toISOString().slice(0, 10)

  // Rule silence is the stand's concern; the API reports a standing rule while it stands.
  const standing = activeRules(rules, { now, freshnessDays: goneAfterDays })
  const ruleFor = new Map(standing.map((rule) => [rule.product.toLowerCase(), rule]))

  const candidates: Item[] = []

  for (const { product, forecast, window, lastClaimAt, balance } of balances) {
    const name = product.toLowerCase()

    if (forecast) {
      if (balance.status === 'none') continue
      if (balance.status === 'known' && balance.quantity <= 0) continue
      if (window && window.to < today) continue
      // "Green cabbage next month", said in September, still reads as coming
      // soon in November unless something ends it. A dated window ends itself; an
      // undated claim ages out with the same silence that makes stock gone.
      if (!window && now.getTime() >= Date.parse(lastClaimAt) + goneAfterDays * MS_PER_DAY) continue

      candidates.push(
        item(name, 'coming_soon', lastClaimAt, {
          expectedFrom: window?.from ?? null,
          availableUntil: window?.to ?? null,
        }),
      )
      continue
    }

    if (balance.confirmedAt === null) continue
    if (balance.status === 'known' && balance.quantity < 0) continue

    const spoke = Date.parse(balance.confirmedAt)
    const soldOut = balance.status === 'none' || (balance.status === 'known' && balance.quantity === 0)
    const silentAt = spoke + goneAfterDays * MS_PER_DAY

    if (soldOut || now.getTime() >= silentAt) {
      // Gone the moment he said so; or the moment the silence ran out.
      const wentAt = soldOut ? spoke : silentAt
      if (now.getTime() < wentAt + GONE_REPORTED_DAYS * MS_PER_DAY) {
        candidates.push(item(name, 'gone', balance.confirmedAt))
      }
      continue
    }

    candidates.push(
      item(name, 'in_season', balance.confirmedAt, {
        availableUntil: ruleFor.get(name)?.endsOn ?? null,
      }),
    )
  }

  for (const rule of standing) {
    candidates.push(
      item(rule.product.toLowerCase(), 'coming_soon', rule.createdAt, {
        expectedFrom: rule.startsOn ?? null,
        availableUntil: rule.endsOn ?? null,
      }),
    )
  }

  // One per crop: best status wins; between two of the same, the one coming soonest.
  const best = new Map<string, Item>()
  for (const candidate of candidates) {
    const held = best.get(candidate.product)
    if (!held || better(candidate, held)) best.set(candidate.product, candidate)
  }

  return [...best.values()].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.product.localeCompare(b.product),
  )
}

/**
 * When the farm last said anything — about anything, including what it has
 * since sold out of or what has since gone quiet. `null` if it never has.
 */
export function farmLastUpdated(balances: ProductBalance[], rules: HarvestRule[]): string | null {
  const times = [...balances.map((b) => b.lastClaimAt), ...rules.map((r) => r.createdAt)]
  if (times.length === 0) return null
  return iso(times.reduce((a, b) => (Date.parse(a) > Date.parse(b) ? a : b)))
}

/** Whether `a` is the more useful statement of the same crop than `b`. */
function better(a: Item, b: Item): boolean {
  if (a.status !== b.status) return ORDER[a.status] < ORDER[b.status]
  return (a.expected_from ?? '9999-12-31') < (b.expected_from ?? '9999-12-31')
}

function item(
  product: string,
  status: Item['status'],
  lastUpdated: string,
  dates: { expectedFrom?: string | null; availableUntil?: string | null } = {},
): Item {
  return {
    product,
    // Until varieties ship (spec 29); in the contract from day one.
    variety: null,
    status,
    last_updated: iso(lastUpdated),
    expected_from: dates.expectedFrom ?? null,
    available_until: dates.availableUntil ?? null,
    // The stand promises no quantities, and neither does the API during the beta.
    quantity: null,
    unit: null,
    price: null,
  }
}

function iso(timestamp: string): string {
  return new Date(timestamp).toISOString()
}
