/**
 * A movement is a change to a farm's stock position. Movements are the only
 * source of truth — the current quantity of anything is derived by folding them.
 *
 * `trueup` is the exception to "change": it is an absolute that resets the
 * balance to the stated figure regardless of accumulated arithmetic. It is what
 * makes the model survivable in the presence of estimates.
 */
export type MovementKind = 'add' | 'remove' | 'trueup'

/**
 * Why stock went. Carried by a reduction and independent of it — the reason
 * never changes the arithmetic, only the record.
 *
 * A closed set, because the farmer's own sentence is kept anyway in
 * `rawPhrase`: this is the part that has to be countable across a season.
 * `spoiled` is one reason among several rather than a kind of its own, which is
 * what it used to be — a crop eaten in the field never reached a crate, and
 * filing deer under rot made the record say something untrue.
 */
export type LossReason =
  | 'sold'
  | 'spoiled'
  | 'wildlife'
  | 'pests'
  | 'weather'
  | 'donated'
  | 'own-use'
  | 'other'

/** `forecast` is a claim about a future window; `confirmed` is a claim about now. */
export type MovementState = 'forecast' | 'confirmed'

/**
 * Where the movement came from. `order` is not built in v0.1 — the field exists
 * from day one so that order-driven decrements are a new source rather than a
 * migration of the only table that matters.
 */
export type MovementSource = 'farmer' | 'order'

/**
 * Unmodelled on purpose. Which units exist, and which products are habitually
 * spoken in which, is an open question for the founder — so this stays a string
 * until his answer can be encoded as values rather than as structure.
 */
export type Unit = string

/**
 * The unit of a bare count — "thirty tomatoes", "a dozen watermelons". He named
 * a number and no unit, because the crop *is* the unit.
 *
 * It is a real unit rather than `null` so that everything downstream keeps
 * working unchanged: counts still fold, and a count still conflicts with a
 * weight, which is correct — nobody can add 30 tomatoes to 5 lb of tomatoes.
 * Display is the only place that treats it specially, by printing nothing.
 */
export const COUNT_UNIT = 'count'

export type Amount = {
  value: number
  unit: Unit
}

/**
 * The period a claim is about. ISO date strings (`YYYY-MM-DD`), inclusive.
 *
 * Only meaningful when there is a demand event to point at — a market day, a
 * school that needs tomatoes in March. **Current stock has no window**, and
 * saying so matters: giving today's movements a "this week" window would split
 * one position in two every time a week boundary rolled past.
 */
export type Window = {
  from: string
  to: string
}

export type Movement = {
  id: string
  farmId: string
  /** The normalised product term. */
  product: string
  /** What the farmer actually said, kept so normalisation stays auditable. */
  rawPhrase?: string
  kind: MovementKind
  /** Why it went. Meaningful on a reduction; ignored on an add or a true-up. */
  reason?: LossReason
  /**
   * Optional on purpose. "I've got collards" is ordinary speech and a valid
   * claim — forcing a number would interrogate him on the most natural sentence
   * in the language. A movement without an amount asserts presence and refreshes
   * confirmation; it does not alter the figure.
   */
  amount?: Amount
  /** true = weighed or counted; false = estimated. Drives estimate debt. */
  measured: boolean
  /** Absent means now — this is stock he has, not a claim about a period. */
  window?: Window
  state: MovementState
  source: MovementSource
  sessionId: string
  /**
   * The read-back this movement came from, when there was one. Provenance, and
   * how the UI knows on reload which proposals he already published.
   */
  proposalId?: string
  /** ISO timestamp. */
  occurredAt: string
}

/**
 * How much of a figure rests on guesses. Never hides anything — it drives the
 * `weighed` / `estimated` annotation a buyer sees, and past a threshold it
 * prompts the farmer to go and weigh something.
 */
type Estimated = {
  estimateDebt: number
  /**
   * When the farmer last confirmed anything about this position, or `null` if
   * every movement is still a forecast about a future window.
   */
  confirmedAt: string | null
  /** Derived: `confirmedAt` plus the product's freshness window. */
  expiresAt: string | null
  /**
   * When the figure last rested on an actual measurement, or `null` if it never
   * has. Drives the annotation that degrades over time — "not weighed in 3
   * weeks" — which is how the system asks for a stocktake without nagging.
   */
  lastMeasuredAt: string | null
  /**
   * Whether this position may still be published. Expiry governs liveness and
   * hides; estimate debt only annotates. Two signals, two jobs.
   */
  live: boolean
}

/** A derived position. Never stored as truth — always folded from movements. */
export type KnownBalance = Estimated & {
  status: 'known'
  quantity: number
  unit: Unit
}

/**
 * The movements for this product disagree on unit — "50 lb" and then "2 boxes"
 * are the same crop counted two ways, and without a conversion there is no
 * honest number. Surfaced rather than guessed: publishing a wrong quantity is
 * the one failure this product exists to prevent.
 */
export type UnitConflict = Estimated & {
  status: 'unit-conflict'
  /** Every unit seen, in first-seen order. */
  units: Unit[]
}

/**
 * He has some and never said how many. Live, expiring, and annotatable like any
 * other position — just without a figure. A buyer driving out for collards
 * mostly needs to know there are collards.
 */
export type PresentBalance = Estimated & {
  status: 'present'
}

/**
 * He has said there is nothing left — whether or not he ever gave a number.
 *
 * Reachable only from something he said, never from a timer: silence makes a
 * position **flagged**, not empty. It exists as a status rather than as a
 * quantity of zero because most of the farm never has a figure at all, so there
 * was no number to zero (ADR 0002).
 */
export type NoneBalance = Estimated & {
  status: 'none'
}

/**
 * A union on purpose. Callers must narrow on `status`, so no code path can read
 * a quantity that was never computable.
 */
export type Balance = KnownBalance | UnitConflict | PresentBalance | NoneBalance
