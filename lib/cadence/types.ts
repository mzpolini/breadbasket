/**
 * A harvest rule — the farmer's standing statement of recurring expected
 * harvest. "Twenty pounds of watermelon every week through September."
 *
 * Stored once, as his sentence, and never expanded into future ledger rows
 * (ADR 0001). A rule is a forecast, not stock: nothing reaches the ledger until
 * he confirms a real harvest at check-in.
 *
 * Append-only like everything else. Changing or ending a rule is a new rule that
 * `supersedes` the old one; newest wins. Re-affirming a rule at check-in is the
 * same thing — a fresh row with the same content, so `createdAt` doubles as
 * "when he last spoke about this".
 */
export type HarvestRule = {
  id: string
  farmId: string
  /** The normalised product term, as in the ledger. */
  product: string
  /** His own sentence, verbatim. What a customer reads under "coming soon". */
  rawPhrase: string
  /** Expected amount per interval. Optional — "watermelon every week" is a valid rule. */
  amount?: { value: number; unit: string }
  /**
   * Only `weekly` is structured for the POC. Anything else he says is kept here
   * verbatim ("tuesdays and thursdays", "every other week") and surfaced to the
   * founder rather than parsed.
   */
  interval: string
  /** YYYY-MM-DD. Absent means "starting now". */
  startsOn?: string
  /** YYYY-MM-DD, inclusive. Absent means "until he says it's done". */
  endsOn?: string
  /** True when this rule *is* the end — "watermelon's done". Supersedes and shows nothing. */
  ended: boolean
  /** The rule this replaces, if any. */
  supersedesId?: string
  /** The read-back this came from. */
  proposalId?: string
  /** When he said it. Doubles as "last spoken about" for the freshness clock. */
  createdAt: string
}

export const WEEKLY = 'weekly'
