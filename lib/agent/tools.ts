import { tool } from 'ai'
import { z } from 'zod'
import { balancesFrom, formatAmount } from '../ledger'
import { farmerInventory } from '../projections'
import { SEED_FRESHNESS, SEED_FRESHNESS_DEFAULT } from '../seed'
import { movementsForFarm } from '../storage/movements'
import { vocabularyFor } from '../storage/vocabulary'
import { resolve } from '../vocabulary'

/**
 * The agent's tool surface.
 *
 * Three tools, and the granularity is deliberate: because the UI renders from
 * tool calls, granularity is a **UI contract** rather than an implementation
 * detail. One coarse `updateInventory` would be easier to build and would show
 * the founder nothing — which fails the pilot's second success criterion
 * outright. These three mirror the three steps the design already narrates:
 * read what he wrote, match it to his crops, then show him the book.
 *
 * **Committing is not here on purpose.** If the model could write to the ledger,
 * then "nothing publishes without his confirmation" would depend on the model
 * behaving itself. It proposes; a server action commits when he taps. The
 * promise is enforced by the architecture, not by good manners.
 */

/** Flat by necessity — schema compliance degrades past a few levels of nesting. */
export const proposedMovementSchema = z.object({
  product: z.string().describe('The crop, normalised to his own vocabulary where known'),
  heardAs: z
    .string()
    .describe(
      'The crop word he actually used, verbatim — "greens", "maters". If he ' +
        'corrects the product, this is what gets taught as meaning it.',
    ),
  rawPhrase: z.string().describe('What he actually said for this crop, verbatim'),
  kind: z
    .enum(['add', 'remove', 'spoil', 'trueup'])
    .describe(
      'trueup = a total ("I have 50"). add = more arrived ("picked 20 more"). ' +
        'remove = sold or given away. spoil = lost. Default to trueup when ambiguous.',
    ),
  amountValue: z
    .number()
    .nullable()
    .describe('Null when he gave no number — that is a valid claim, not a failure'),
  amountUnit: z
    .string()
    .nullable()
    .describe('His unit, as he says it: lb, bunch, bushel, box, dozen, head'),
  measured: z
    .boolean()
    .describe(
      'True only if he signalled measurement — weighed, counted, on the scale, ' +
        'or gave a non-round figure. A bare "50 pounds" is an estimate.',
    ),
  forecast: z
    .boolean()
    .describe('True when this is about a future period rather than stock on hand'),
  windowFrom: z.string().nullable().describe('YYYY-MM-DD, only for a forecast'),
  windowTo: z.string().nullable().describe('YYYY-MM-DD, only for a forecast'),
})

export type ProposedMovement = z.infer<typeof proposedMovementSchema>

export function farmTools(farmId: string) {
  return {
    getCurrentStock: tool({
      description:
        'What this farm currently has, folded from everything he has ever said. ' +
        'Use it before asking him about a crop, and to name his crops back to him.',
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date()
        const rows = farmerInventory(
          balancesFrom(await movementsForFarm(farmId), {
            now,
            freshnessDays: SEED_FRESHNESS_DEFAULT,
            freshnessByProduct: SEED_FRESHNESS,
          }),
          { now },
        )

        return {
          crops: rows.map((row) => ({
            product: row.product,
            amount: row.quantity ? formatAmount(row.quantity) : 'some',
            confidence: row.confidence,
            live: row.live,
            needsAttention: row.attention,
          })),
        }
      },
    }),

    resolveProducts: tool({
      description:
        "Match the words he used to crops this farm already knows. There is no " +
        'canonical produce list — his vocabulary accretes from his own corrections, ' +
        'so an unknown term is a new crop rather than an error. Use the product it ' +
        'returns, not his word, when it comes back known.',
      inputSchema: z.object({
        terms: z.array(z.string()).describe('The crop words he used, verbatim'),
      }),
      execute: async ({ terms }) => {
        const vocab = await vocabularyFor(farmId)
        // Anything already in the ledger counts as known too, even if he has
        // never had to correct it.
        const inLedger = new Set(
          (await movementsForFarm(farmId)).map((movement) => movement.product.toLowerCase()),
        )

        return {
          resolved: terms.map((term) => {
            const resolution = resolve(vocab, term)
            return {
              term,
              product: resolution.product,
              known: resolution.known || inLedger.has(term.trim().toLowerCase()),
              /** True when this is his own taught word rather than a plain match. */
              learned: resolution.known,
            }
          }),
        }
      },
    }),

    proposeMovements: tool({
      description:
        'Show him what you heard, so he can correct it before anything is published. ' +
        'Call this once you understand the whole message. It writes nothing.',
      inputSchema: z.object({
        movements: z.array(proposedMovementSchema),
      }),
      execute: async ({ movements }) => ({
        proposed: movements.length,
        // Returned so the UI can render the read-back and offer "Put it up".
        movements,
      }),
    }),
  }
}
