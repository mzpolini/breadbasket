import { COUNT_UNIT, type Movement } from '../ledger'
import type { ProposedMovement } from './tools'

/**
 * Turns what the model proposed into what the ledger records.
 *
 * Pure, and separate from the server action, because this is the one conversion
 * in the system where a bug is invisible: a dropped field doesn't throw, it just
 * quietly makes his stock page vaguer than his own words were. It cost us
 * exactly that once — bare counts arriving with their numbers stripped — so the
 * rule here is that **anything he said survives**, and the only fields this
 * function is allowed to override are ones the model cannot know better than the
 * data does.
 */

export type CommitContext = {
  farmId: string
  sessionId: string
  /** One timestamp for the whole batch: he said it all in one breath. */
  occurredAt: string
  newId: () => string
}

export function toMovements(proposed: ProposedMovement[], ctx: CommitContext): Movement[] {
  return proposed.map((item) => {
    const amount = toAmount(item)

    return {
      id: ctx.newId(),
      farmId: ctx.farmId,
      product: item.product.toLowerCase().trim(),
      ...(item.rawPhrase ? { rawPhrase: item.rawPhrase } : {}),
      kind: item.kind,
      ...(amount ? { amount } : {}),
      // A claim with no number cannot have been measured, whatever the model said.
      measured: amount ? item.measured : false,
      ...(item.forecast && item.windowFrom && item.windowTo
        ? { window: { from: item.windowFrom, to: item.windowTo } }
        : {}),
      state: item.forecast ? 'forecast' : 'confirmed',
      source: 'farmer',
      sessionId: ctx.sessionId,
      occurredAt: ctx.occurredAt,
    }
  })
}

/**
 * The number is what matters; the unit is optional decoration on it.
 *
 * Requiring both is what caused the bug — "thirty tomatoes" has a number and no
 * unit word, and demanding a pair threw the number away with it.
 */
function toAmount(item: ProposedMovement) {
  if (item.amountValue === null) return undefined
  return { value: item.amountValue, unit: item.amountUnit?.trim() || COUNT_UNIT }
}
