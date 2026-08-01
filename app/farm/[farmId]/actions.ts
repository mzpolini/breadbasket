'use server'

import { revalidatePath } from 'next/cache'
import { toMovements } from '@/lib/agent/commit'
import type { ProposedMovement } from '@/lib/agent/tools'
import { requireFarmAccess } from '@/lib/auth/current-user'
import { appendMovements } from '@/lib/storage/movements'
import { teach } from '@/lib/storage/vocabulary'

/**
 * The only way anything reaches the ledger.
 *
 * Deliberately a server action rather than a tool the model can call: the
 * promise is that nothing publishes without his confirmation, and a promise
 * enforced by architecture holds better than one enforced by a system prompt.
 * The model proposes; this runs when he taps.
 *
 * Every action explicitly verifies farm access — Proxy doesn't cover Server
 * Actions, per Next.js 16 guidance.
 */
export async function commitProposed(
  farmId: string,
  proposed: ProposedMovement[],
  proposalId?: string,
) {
  await requireFarmAccess(farmId)

  const movements = toMovements(proposed, {
    farmId,
    sessionId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    proposalId,
    newId: () => crypto.randomUUID(),
  })

  await appendMovements(movements)

  await Promise.all(
    proposed.map((item) => teach(farmId, item.heardAs, item.product.toLowerCase().trim())),
  )

  revalidatePath(`/f/${farmId}`)
  revalidatePath('/farm', 'layout')

  return { written: movements.length }
}

/**
 * "Sold out" — a true-up to zero, and measured, because an empty crate is the
 * one quantity a farmer is never estimating.
 */
export async function markSoldOut(farmId: string, product: string) {
  await appendPlain(farmId, product, { kind: 'trueup', amountValue: 0, amountUnit: null, measured: true })
  return { soldOut: product }
}

/**
 * Both buttons go through `toMovements` rather than building a row directly, so
 * a movement written by a tap is indistinguishable from one written by speech.
 */
async function appendPlain(
  farmId: string,
  product: string,
  over: Partial<ProposedMovement> & Pick<ProposedMovement, 'kind'>,
) {
  await requireFarmAccess(farmId)

  const movements = toMovements(
    [
      {
        product,
        heardAs: product,
        rawPhrase: '',
        measured: false,
        forecast: false,
        windowFrom: null,
        windowTo: null,
        amountValue: null,
        amountUnit: null,
        ...over,
      },
    ],
    {
      farmId,
      sessionId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    },
  )

  await appendMovements(movements)

  revalidatePath(`/f/${farmId}`)
  revalidatePath('/farm', 'layout')
}
