import { boolean, doublePrecision, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
  ],
)

export type MovementRow = typeof movements.$inferSelect
export type NewMovementRow = typeof movements.$inferInsert
