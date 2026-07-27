import {
  bigserial,
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Movements — the only source of truth.
 *
 * **Append-only.** Nothing here is ever updated or deleted: a correction is a
 * new movement, and a true-up is an absolute that supersedes the arithmetic
 * without erasing it. That is what lets the system answer "what did we claim,
 * and when" — the question a buyer asks after driving out for nothing.
 *
 * Balances are never stored. They are folded on read by `lib/ledger`.
 */
export const movements = pgTable(
  'movements',
  {
    id: text('id').primaryKey(),

    /**
     * Multi-tenant from the start even at one farmer: a farm is a row, not an
     * instance. Retro-fitting tenancy is the migration nobody enjoys.
     */
    farmId: text('farm_id').notNull(),

    /** The normalised product term. */
    product: text('product').notNull(),
    /** What he actually said, so normalisation stays auditable. */
    rawPhrase: text('raw_phrase'),

    /** add | remove | spoil | trueup — see lib/ledger/types. */
    kind: text('kind').notNull(),

    /**
     * Nullable on purpose. "I've got collards" is a valid claim with no number,
     * and forcing one would interrogate him on the most natural sentence there
     * is. Stored as double precision because the fold does JavaScript
     * arithmetic anyway — exact decimals here would be a promise the ledger
     * cannot keep. Fine for pounds of tomatoes; revisit if money ever lands in
     * this table.
     */
    amountValue: doublePrecision('amount_value'),
    amountUnit: text('amount_unit'),

    /** true = weighed or counted, false = estimated. Drives estimate debt. */
    measured: boolean('measured').notNull(),

    /**
     * Absent means now — this is stock he has, not a claim about a period. Only
     * a demand event (a market day, a school needing tomatoes in March) gives a
     * movement a window.
     */
    windowFrom: text('window_from'),
    windowTo: text('window_to'),

    /** forecast | confirmed. */
    state: text('state').notNull(),

    /**
     * farmer | order. Orders are out of scope for v0.1; the column exists so a
     * future order-driven decrement is a new source rather than a migration of
     * the one table that matters.
     */
    source: text('source').notNull(),

    sessionId: text('session_id').notNull(),

    /**
     * The read-back this came from — the agent's tool-call id.
     *
     * Provenance, and load-bearing: on reload it is the only way to know which
     * read-back cards he already published. Without it a published card comes
     * back offering "Put it up" again, and tapping it writes the whole batch a
     * second time. Null for movements written before this existed, and for the
     * stock screen's buttons, which have no read-back behind them.
     */
    proposalId: text('proposal_id'),

    /**
     * When it happened, not when it was written. The fold sorts on this, and a
     * true-up applied out of sequence discards everything that legitimately
     * followed it — so this is load-bearing rather than metadata.
     */
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // The only read that matters: everything for one farm, folded per product.
    index('movements_farm_product_idx').on(table.farmId, table.product),
    index('movements_occurred_at_idx').on(table.occurredAt),
    index('movements_proposal_idx').on(table.farmId, table.proposalId),
  ],
)

export type MovementRow = typeof movements.$inferSelect
export type NewMovementRow = typeof movements.$inferInsert

/**
 * A farm's private language — his word for a crop, and what it means.
 *
 * There is no canonical produce taxonomy and no setup step. This accretes from
 * corrections: he says "greens", the read-back shows the wrong greens, he fixes
 * it, and the mapping is learned. That correction *is* the onboarding.
 *
 * Scoped per farm because one farmer's "greens" is another's mustard. Keyed on
 * the normalised term so it survives ragged input — speech-to-text and thumbs
 * on a phone both produce it.
 */
export const vocabulary = pgTable(
  'vocabulary',
  {
    farmId: text('farm_id').notNull(),
    /** Normalised: trimmed and lowercased. */
    term: text('term').notNull(),
    product: text('product').notNull(),
    /** Last write wins — the most recent correction is the one he meant. */
    learnedAt: timestamp('learned_at', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.farmId, table.term] })],
)

export type VocabularyRow = typeof vocabulary.$inferSelect

/**
 * The conversation, kept.
 *
 * Stored in `useChat`'s own UIMessage shape — parts and all — so a reload
 * restores what he actually saw, read-back cards included, rather than a
 * flattened transcript of text. That fidelity is the point: an un-tapped
 * proposal must survive a closed tab, or he said something, watched it be
 * understood, and lost it.
 *
 * This is a **record, not the agent's memory.** What the farm has is folded from
 * movements, and the agent reads that with a tool — so only a recent window of
 * this ever reaches the model's context. The transcript is here to show him, and
 * to give the parser eval real utterances instead of invented ones.
 */
export const messages = pgTable(
  'messages',
  {
    /** The UIMessage id, so re-saving a turn updates it rather than duplicating. */
    id: text('id').primaryKey(),
    farmId: text('farm_id').notNull(),
    /** user | assistant | system. */
    role: text('role').notNull(),
    /** The full UIMessage `parts` array: text, tool calls, tool results. */
    parts: jsonb('parts').notNull(),
    /**
     * Insert order. Timestamps collide inside a millisecond, and a conversation
     * that reloads out of order is worse than one that reloads not at all.
     */
    seq: bigserial('seq', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('messages_farm_seq_idx').on(table.farmId, table.seq)],
)

export type MessageRow = typeof messages.$inferSelect
