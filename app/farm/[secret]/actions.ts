'use server'

import { revalidatePath } from 'next/cache'
import { toMovements } from '@/lib/agent/commit'
import type { ProposedMovement } from '@/lib/agent/tools'
import { SEED_FARM_ID } from '@/lib/seed'
import { appendMovements } from '@/lib/storage/movements'
import { teach } from '@/lib/storage/vocabulary'

/**
 * The only way anything reaches the ledger.
 *
 * Deliberately a server action rather than a tool the model can call: the
 * promise is that nothing publishes without his confirmation, and a promise
 * enforced by architecture holds better than one enforced by a system prompt.
 * The model proposes; this runs when he taps.
 */
export async function commitProposed(proposed: ProposedMovement[]) {
  // The conversion itself lives in `lib/agent/commit` so it can be tested
  // without a database — it is the one place a dropped field is silent.
  const movements = toMovements(proposed, {
    farmId: SEED_FARM_ID,
    sessionId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    newId: () => crypto.randomUUID(),
  })

  await appendMovements(movements)

  // His corrections are the only teacher there is. If the word he used differs
  // from the crop it turned out to mean, that mapping is his — remember it, so
  // next week "greens" resolves without him having to say it twice.
  await Promise.all(
    proposed.map((item) => teach(SEED_FARM_ID, item.heardAs, item.product.toLowerCase().trim())),
  )

  revalidatePath(`/f/${SEED_FARM_ID}`)
  revalidatePath('/farm', 'layout')

  return { written: movements.length }
}
