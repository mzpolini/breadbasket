import type { Balance, Movement, Window } from './types'

export type FoldOptions = {
  /** Evaluation time, injected so expiry is testable and never reads the clock. */
  now: Date
  /** Default window, for products with no entry below. */
  freshnessDays: number
  /**
   * Per-product windows. Salad greens go in days; winter squash sits for months,
   * so one number for a whole farm would be wrong in both directions. The
   * founder's answer lands here as values — never as structure.
   *
   * Read by `balancesFrom`, which knows the product. `foldBalance` folds a
   * single position and is handed the already-resolved number.
   */
  freshnessByProduct?: Record<string, number>
}

type Position = {
  quantity: number
  estimateDebt: number
  /** He said it is gone. Set by a reduction with no number; any later claim lifts it. */
  cleared: boolean
}

const EMPTY: Position = { quantity: 0, estimateDebt: 0, cleared: false }

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Folds movements into the position they describe.
 */
export function foldBalance(movements: Movement[], opts: FoldOptions): Balance {
  const { quantity, estimateDebt, cleared } = chronological(movements).reduce(applyMovement, EMPTY)
  const units = distinctUnits(movements)

  const confirmedAt = latestConfirmedAt(movements)
  const expiresAt =
    confirmedAt === null
      ? null
      : new Date(Date.parse(confirmedAt) + opts.freshnessDays * MS_PER_DAY).toISOString()
  const live = expiresAt !== null && opts.now.getTime() < Date.parse(expiresAt)

  const freshness = {
    estimateDebt,
    confirmedAt,
    expiresAt,
    live,
    lastMeasuredAt: latestMeasuredAt(movements),
  }

  // Decided before units on purpose: he has said there is nothing there, so
  // there is nothing to total and a disagreement about units no longer matters.
  // It is also the only way out of a unit conflict that isn't a true-up.
  if (cleared) {
    return { status: 'none', ...freshness }
  }

  // No movement ever carried an amount, so there is no figure to report — only
  // that he has some. Also the shape an empty movement list folds to.
  if (units.length === 0) {
    return { status: 'present', ...freshness }
  }

  if (units.length > 1) {
    return { status: 'unit-conflict', units, ...freshness }
  }

  return { status: 'known', quantity, unit: units[0], ...freshness }
}

/** One folded position, and what it is a position in. */
export type ProductBalance = {
  farmId: string
  product: string
  /**
   * A claim about the future rather than stock on hand.
   *
   * Read from the movements' state, **not** from whether a window is present.
   * He can say "lettuce in a couple of weeks" and mean it without naming dates,
   * and inferring forecast-ness from a window left that claim with nowhere to
   * live: it folded in with current stock, never confirmed, and surfaced as
   * stale stock instead of as something coming.
   */
  forecast: boolean
  /** The period a forecast is about, when he gave one. */
  window?: Window
  balance: Balance
}

/**
 * Folds a flat list of movements into one position per farm, product, and
 * window. A future window is a separate position from the current one, so
 * "about 30lb ready next week" never inflates what is available today.
 *
 * `farmId` is part of the key because the system is multi-tenant: a farm is a
 * row, not an instance, so nothing may assume a list belongs to one farm.
 */
export function balancesFrom(movements: Movement[], opts: FoldOptions): ProductBalance[] {
  const groups = new Map<string, Movement[]>()

  for (const movement of movements) {
    const key = [
      movement.farmId,
      movement.product,
      // Forecasts are keyed apart from stock even when undated, or an expected
      // harvest would fold into what he has on hand. Within forecasts each
      // window is its own position; undated ones share a bucket.
      movement.state === 'forecast'
        ? `forecast ${movement.window ? `${movement.window.from}..${movement.window.to}` : 'undated'}`
        : 'current',
    ].join(' ')

    const group = groups.get(key)
    if (group) group.push(movement)
    else groups.set(key, [movement])
  }

  return [...groups.values()].map((group) => {
    const { product } = group[0]

    return {
      farmId: group[0].farmId,
      product,
      forecast: group[0].state === 'forecast',
      window: group[0].window,
      balance: foldBalance(group, {
        ...opts,
        freshnessDays: opts.freshnessByProduct?.[product] ?? opts.freshnessDays,
      }),
    }
  })
}

/**
 * Order matters absolutely: a `trueup` is an absolute, so applying one out of
 * sequence discards every movement that legitimately followed it. Storage makes
 * no ordering promise, so the fold cannot inherit one. Copies rather than
 * sorting in place — callers keep their array.
 */
function chronological(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
}

function distinctUnits(movements: Movement[]): string[] {
  return [...new Set(movements.flatMap((movement) => (movement.amount ? [movement.amount.unit] : [])))]
}

/**
 * A forecast is a claim about a future window, not a confirmation of what is
 * here now — so it never makes a position publishable on its own.
 */
function latestConfirmedAt(movements: Movement[]): string | null {
  const confirmed = movements
    .filter((movement) => movement.state === 'confirmed')
    .map((movement) => movement.occurredAt)

  return confirmed.length === 0 ? null : confirmed.reduce((a, b) => (a > b ? a : b))
}

function latestMeasuredAt(movements: Movement[]): string | null {
  const measured = movements
    .filter((movement) => movement.measured && movement.amount !== undefined)
    .map((movement) => movement.occurredAt)

  return measured.length === 0 ? null : measured.reduce((a, b) => (a > b ? a : b))
}

/**
 * Anything that is not an addition or an absolute takes stock out.
 *
 * Written as "not add, not trueup" rather than as a list of reductions so that
 * a row carrying a kind this version no longer names — `spoil`, before it
 * became a reason — still reduces instead of falling through and leaving the
 * stock standing. Silently keeping food that a farmer said was gone is the
 * expensive direction to be wrong in.
 */
function reduces(kind: Movement['kind']): boolean {
  return kind !== 'add' && kind !== 'trueup'
}

function applyMovement(position: Position, movement: Movement): Position {
  const estimateDebt = movement.measured ? position.estimateDebt : position.estimateDebt + 1

  if (movement.amount === undefined) {
    // "The deer ate them" carries no number, because that is how it is said. A
    // reduction with nothing to subtract empties the position outright (ADR
    // 0002) — reading it as presence left the figure standing and the freshness
    // clock freshly reset, so the crop came back stronger than before.
    if (reduces(movement.kind)) {
      return { quantity: 0, estimateDebt, cleared: true }
    }

    // "I've got collards" asserts he still has some, not how many. It refreshes
    // confirmation and counts toward drift, but must not disturb the figure.
    return { quantity: position.quantity, estimateDebt, cleared: false }
  }

  const { value } = movement.amount

  // An absolute, not a delta: a measurement outranks whatever the running
  // arithmetic had drifted to. Because it replaces the position outright it
  // also replaces the accumulated drift — so debt restarts from this movement
  // alone, which is zero when he actually weighed it.
  if (movement.kind === 'trueup') {
    return { quantity: value, estimateDebt: movement.measured ? 0 : 1, cleared: false }
  }

  if (reduces(movement.kind)) {
    return { quantity: position.quantity - value, estimateDebt, cleared: false }
  }

  return { quantity: position.quantity + value, estimateDebt, cleared: false }
}

export type { Movement, Balance, Window, Amount } from './types'
export { COUNT_UNIT } from './types'
export { formatAmount, formatUnit } from './format'
