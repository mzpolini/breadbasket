import { tool } from 'ai'
import { z } from 'zod'
import { balancesFrom, formatAmount } from '../ledger'
import { farmerInventory } from '../projections'
import { activeRules } from '../cadence'
import { FRESHNESS_DAYS } from '../seed'
import { rulesForFarm } from '../storage/harvest-rules'
import { movementsForFarm } from '../storage/movements'
import { remember } from '../storage/notes'
import { vocabularyFor } from '../storage/vocabulary'
import { resolve } from '../vocabulary'

/**
 * The agent's tool surface.
 *
 * The granularity is deliberate: because the UI renders from tool calls,
 * granularity is a **UI contract** rather than an implementation detail. One
 * coarse `updateInventory` would be easier to build and would show the founder
 * nothing — which fails the pilot's second success criterion outright. The first
 * three mirror the steps the design already narrates: read what he wrote, match
 * it to his crops, then show him the book. The fourth keeps what he said about
 * the farm itself, which is context rather than stock.
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

/**
 * A harvest rule as the model proposes it. Flat, like a movement. A rule is
 * never stock: it is what he expects to pick on repeat, and it shows a customer
 * only as "coming soon", in his own words.
 */
export const proposedRuleSchema = z.object({
  product: z.string().describe('The crop, normalised to his own vocabulary where known'),
  heardAs: z.string().describe('The crop word he actually used, verbatim'),
  rawPhrase: z
    .string()
    .describe(
      'His whole sentence about this rhythm, verbatim — this is what buyers read. ' +
        '"about twenty pounds of watermelon every week through September"',
    ),
  amountValue: z.number().nullable().describe('Expected amount per interval; null if he gave none'),
  amountUnit: z.string().nullable().describe('His unit, as he says it'),
  interval: z
    .string()
    .describe(
      'Exactly "weekly" when he means once a week, however he phrased it. Anything ' +
        'else — "tuesdays and thursdays", "every other week" — copy his words as-is.',
    ),
  startsOn: z.string().nullable().describe('YYYY-MM-DD if he said when it starts; else null'),
  endsOn: z.string().nullable().describe('YYYY-MM-DD if he said when it ends; else null'),
  ended: z
    .boolean()
    .describe('True only when he is saying the rhythm is over — "watermelon\'s done"'),
})

export type ProposedRule = z.infer<typeof proposedRuleSchema>

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
            freshnessDays: FRESHNESS_DAYS,
          }),
          { now },
        )

        const rules = activeRules(await rulesForFarm(farmId), { now, freshnessDays: FRESHNESS_DAYS })

        return {
          crops: rows.map((row) => ({
            product: row.product,
            amount: row.quantity ? formatAmount(row.quantity) : 'some',
            confidence: row.confidence,
            /** False means flagged: he has not mentioned it in a week. Still shown, as stale. */
            fresh: row.live,
            needsAttention: row.attention,
          })),
          /** Standing harvest rules — what he expects to pick on repeat. Not stock. */
          harvestRules: rules.map((rule) => ({
            product: rule.product,
            saidAs: rule.rawPhrase,
            interval: rule.interval,
            endsOn: rule.endsOn ?? null,
            daysSinceHeMentionedIt: rule.daysSinceSpoken,
            flagged: rule.flagged,
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

    proposeHarvestRules: tool({
      description:
        'Show him what you heard about a harvest *rhythm* — a crop he expects to ' +
        'pick on repeat: "twenty pounds of watermelon every week through September". ' +
        'Also for changing one ("make it fifteen"), re-affirming one at check-in ' +
        '("still on for watermelon"), or ending one ("watermelon\'s done"). ' +
        'Never for stock he has now — that is proposeMovements. It writes nothing.',
      inputSchema: z.object({
        rules: z.array(proposedRuleSchema),
      }),
      execute: async ({ rules }) => ({ proposed: rules.length, rules }),
    }),

    rememberAboutFarm: tool({
      description:
        'Keep something he said about how the farm runs — a picking rhythm, a ' +
        'market day, a field coming in late. Only for standing facts, never for ' +
        'stock: a quantity is a movement and belongs in proposeMovements. Use his ' +
        'own words. Say it back in one short line so he can correct it.',
      inputSchema: z.object({
        note: z
          .string()
          .describe(
            'One standing fact, in his phrasing — "picks Tuesdays and Thursdays". ' +
              'Not a quantity, and not a promise to do something later.',
          ),
      }),
      // No tap gate, unlike a movement: this reaches his context, never his
      // public page, so there is nothing here for a buyer to be misled by.
      execute: async ({ note }) => {
        await remember(farmId, note)
        return { remembered: note }
      },
    }),
  }
}
