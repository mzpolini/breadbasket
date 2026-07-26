'use server'

import { revalidatePath } from 'next/cache'
import type { ProposedMovement } from '@/lib/agent/tools'
import type { Movement } from '@/lib/ledger'
import { SEED_FARM_ID } from '@/lib/seed'
import { appendMovements } from '@/lib/storage/movements'

/**
 * The only way anything reaches the ledger.
 *
 * Deliberately a server action rather than a tool the model can call: the
 * promise is that nothing publishes without his confirmation, and a promise
 * enforced by architecture holds better than one enforced by a system prompt.
 * The model proposes; this runs when he taps.
 */
export async function commitProposed(proposed: ProposedMovement[]) {
  const sessionId = crypto.randomUUID()
  const occurredAt = new Date().toISOString()

  const movements: Movement[] = proposed.map((item) => ({
    id: crypto.randomUUID(),
    farmId: SEED_FARM_ID,
    product: item.product.toLowerCase().trim(),
    rawPhrase: item.rawPhrase,
    kind: item.kind,
    ...(item.amountValue !== null && item.amountUnit !== null
      ? { amount: { value: item.amountValue, unit: item.amountUnit } }
      : {}),
    // A claim with no number cannot have been measured, whatever the model said.
    measured: item.amountValue === null ? false : item.measured,
    ...(item.forecast && item.windowFrom && item.windowTo
      ? { window: { from: item.windowFrom, to: item.windowTo } }
      : {}),
    state: item.forecast ? 'forecast' : 'confirmed',
    source: 'farmer',
    sessionId,
    occurredAt,
  }))

  await appendMovements(movements)

  revalidatePath(`/f/${SEED_FARM_ID}`)
  revalidatePath('/farm', 'layout')

  return { written: movements.length }
}
