import type { Balance, Movement } from './types'

export type FoldOptions = {
  /** Evaluation time, injected so expiry is testable and never reads the clock. */
  now: Date
  /** How long a confirmed figure stays true for this product. */
  freshnessDays: number
}

/**
 * Folds movements into the position they describe.
 */
type Position = {
  quantity: number
  estimateDebt: number
}

const EMPTY: Position = { quantity: 0, estimateDebt: 0 }

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function foldBalance(movements: Movement[], opts: FoldOptions): Balance {
  const { quantity, estimateDebt } = movements.reduce(applyMovement, EMPTY)
  const units = distinctUnits(movements)

  const confirmedAt = latestConfirmedAt(movements)
  const expiresAt =
    confirmedAt === null
      ? null
      : new Date(Date.parse(confirmedAt) + opts.freshnessDays * MS_PER_DAY).toISOString()
  const live = expiresAt !== null && opts.now.getTime() < Date.parse(expiresAt)

  const freshness = { estimateDebt, confirmedAt, expiresAt, live }

  if (units.length > 1) {
    return { status: 'unit-conflict', units, ...freshness }
  }

  return { status: 'known', quantity, unit: units[0], ...freshness }
}

function distinctUnits(movements: Movement[]): string[] {
  return [...new Set(movements.map((movement) => movement.amount.unit))]
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

function applyMovement(position: Position, movement: Movement): Position {
  const estimateDebt = movement.measured ? position.estimateDebt : position.estimateDebt + 1

  switch (movement.kind) {
    // An absolute, not a delta: a measurement outranks whatever the running
    // arithmetic had drifted to. Because it replaces the position outright it
    // also replaces the accumulated drift — so debt restarts from this movement
    // alone, which is zero when he actually weighed it.
    case 'trueup':
      return {
        quantity: movement.amount.value,
        estimateDebt: movement.measured ? 0 : 1,
      }
    case 'remove':
    case 'spoil':
      return { quantity: position.quantity - movement.amount.value, estimateDebt }
    case 'add':
      return { quantity: position.quantity + movement.amount.value, estimateDebt }
  }
}

export type { Movement, Balance } from './types'
