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

/**
 * "Still true" — the one verb design `1d` allows on the stock screen.
 *
 * It writes a **presence-only movement**: no amount, so the figure is untouched,
 * but the confirmation clock restarts and the crop stays on his page. That is
 * precisely what the ledger already means by a movement with no amount, so this
 * needs no special case anywhere downstream.
 *
 * Deliberately not an edit. There is exactly one way stock changes — something
 * he said — so this view and the conversation can never disagree.
 */
export async function confirmStillTrue(product: string) {
  await appendPlain(product, { kind: 'trueup', amountValue: null, amountUnit: null })
  return { confirmed: product }
}

/**
 * "Sold out" — a true-up to zero, and measured, because an empty crate is the
 * one quantity a farmer is never estimating.
 */
export async function markSoldOut(product: string) {
  await appendPlain(product, { kind: 'trueup', amountValue: 0, amountUnit: null, measured: true })
  return { soldOut: product }
}

/**
 * Both buttons go through `toMovements` rather than building a row directly, so
 * a movement written by a tap is indistinguishable from one written by speech.
 */
async function appendPlain(
  product: string,
  over: Partial<ProposedMovement> & Pick<ProposedMovement, 'kind'>,
) {
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
      farmId: SEED_FARM_ID,
      sessionId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    },
  )

  await appendMovements(movements)

  revalidatePath(`/f/${SEED_FARM_ID}`)
  revalidatePath('/farm', 'layout')
}
