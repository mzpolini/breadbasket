import { tool } from 'ai'
import { z } from 'zod'
import { balancesFrom, formatAmount } from '../ledger'
import { farmerInventory } from '../projections'
import { activeRules } from '../cadence'
import { FRESHNESS_DAYS } from '../settings'
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
  product: z.string().describe('The crop, normalised to their own vocabulary where known'),
  heardAs: z
    .string()
    .describe(
      'The crop word they actually used, verbatim — "greens", "maters". If they ' +
        'correct the product, this is what gets taught as meaning it.',
    ),
  rawPhrase: z.string().describe('What they actually said for this crop, verbatim'),
  kind: z
    .enum(['add', 'remove', 'trueup'])
    .describe(
      'trueup = a total ("I have 50"). add = more arrived ("picked 20 more"). ' +
        'remove = stock went, for any reason — say which in `reason`. ' +
        'Default to trueup when ambiguous.',
    ),
  reason: z
    .enum(['sold', 'spoiled', 'wildlife', 'pests', 'weather', 'donated', 'own-use', 'other'])
    .nullable()
    .describe(
      'Only on a remove: why it went. Deer or birds are wildlife, insects are ' +
        'pests, rot is spoiled, hail or drought is weather. Null on an add or a ' +
        'true-up. Use other, never a guess, when they said why and none of these fit.',
    ),
  amountValue: z
    .number()
    .nullable()
    .describe(
      'Null when they gave no number — that is a valid claim, not a failure. On a ' +
        'remove, null means all of it: the position empties.',
    ),
  amountUnit: z
    .string()
    .nullable()
    .describe('Their unit, as they say it: lb, bunch, bushel, box, dozen, head'),
  measured: z
    .boolean()
    .describe(
      'True only if they signalled measurement — weighed, counted, on the scale, ' +
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
  product: z.string().describe('The crop, normalised to their own vocabulary where known'),
  heardAs: z.string().describe('The crop word they actually used, verbatim'),
  rawPhrase: z
    .string()
    .describe(
      'Their whole sentence about this rhythm, verbatim — this is what buyers read. ' +
        '"about twenty pounds of watermelon every week through September"',
    ),
  amountValue: z.number().nullable().describe('Expected amount per interval; null if they gave none'),
  amountUnit: z.string().nullable().describe('Their unit, as they say it'),
  interval: z
    .string()
    .describe(
      'Exactly "weekly" when they mean once a week, however they phrased it. Anything ' +
        'else — "tuesdays and thursdays", "every other week" — copy their words as-is.',
    ),
  startsOn: z.string().nullable().describe('YYYY-MM-DD if they said when it starts; else null'),
  endsOn: z.string().nullable().describe('YYYY-MM-DD if they said when it ends; else null'),
  ended: z
    .boolean()
    .describe('True only when they are saying the rhythm is over — "watermelon\'s done"'),
})

export type ProposedRule = z.infer<typeof proposedRuleSchema>

/**
 * `postedBy` is the signed-in person this conversation belongs to, so anything a
 * tool writes directly (a note) is attributed like a tap-published movement.
 */
export function farmTools(farmId: string, postedBy?: string) {
  return {
    getCurrentStock: tool({
      description:
        'What this farm currently has, folded from everything they have ever said. ' +
        'Use it before asking them about a crop, and to name their crops back to them.',
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
            daysSinceMentioned: rule.daysSinceSpoken,
            flagged: rule.flagged,
          })),
        }
      },
    }),

    resolveProducts: tool({
      description:
        "Match the words they used to crops this farm already knows. There is no " +
        'canonical produce list — their vocabulary accretes from their own corrections, ' +
        'so an unknown term is a new crop rather than an error. Use the product it ' +
        'returns, not their word, when it comes back known.',
      inputSchema: z.object({
        terms: z.array(z.string()).describe('The crop words they used, verbatim'),
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
        'Show them what you heard, so they can correct it before anything is published. ' +
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
        'Show them what you heard about a harvest *rhythm* — a crop they expect to ' +
        'pick on repeat: "twenty pounds of watermelon every week through September". ' +
        'Also for changing one ("make it fifteen"), re-affirming one at check-in ' +
        '("still on for watermelon"), or ending one ("watermelon\'s done"). ' +
        'Never for stock they have now — that is proposeMovements. It writes nothing.',
      inputSchema: z.object({
        rules: z.array(proposedRuleSchema),
      }),
      execute: async ({ rules }) => ({ proposed: rules.length, rules }),
    }),

    publishPending: tool({
      description:
        'They have looked at the read-back and said it is right. Call this to put it up. ' +
        'Only on an unambiguous yes to a read-back you have just shown them — never to ' +
        'publish something they have not seen, and never on a qualified answer like ' +
        '"yes, but make it thirty", which is a correction and needs a fresh read-back.',
      inputSchema: z.object({}),
      /**
       * Writes nothing, and cannot. It is a signal to his screen, which then
       * publishes **the card he is looking at** through the same server action
       * the button uses — his edits included.
       *
       * This is a deliberate, narrow loosening of "only a tap publishes". The
       * model still has no path to the ledger, and it still cannot compose what
       * gets written: the only thing it can do is approve movements he has
       * already seen read back. What it buys is that "yes" means yes, which is
       * the difference between a check-in that happens and one that doesn't.
       */
      execute: async () => ({ publish: true }),
    }),

    rememberAboutFarm: tool({
      description:
        'Keep something they said about how the farm runs — a picking rhythm, a ' +
        'market day, a field coming in late. Only for standing facts, never for ' +
        'stock: a quantity is a movement and belongs in proposeMovements. Use their ' +
        'own words. Say it back in one short line so they can correct it.',
      inputSchema: z.object({
        note: z
          .string()
          .describe(
            'One standing fact, in their phrasing — "picks Tuesdays and Thursdays". ' +
              'Not a quantity, and not a promise to do something later.',
          ),
      }),
      // No tap gate, unlike a movement: this reaches his context, never his
      // public page, so there is nothing here for a buyer to be misled by.
      execute: async ({ note }) => {
        await remember(farmId, note, postedBy)
        return { remembered: note }
      },
    }),
  }
}
