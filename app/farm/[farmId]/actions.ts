'use server'

import { revalidatePath } from 'next/cache'
import { toMovements, toRules } from '@/lib/agent/commit'
import type { ProposedMovement, ProposedRule } from '@/lib/agent/tools'
import { activeRules } from '@/lib/cadence'
import { FRESHNESS_DAYS } from '@/lib/seed'
import { appendRules, rulesForFarm } from '@/lib/storage/harvest-rules'
import { requireFarmAccess } from '@/lib/auth/current-user'
import { appendMovements } from '@/lib/storage/movements'
import { claimProposal } from '@/lib/storage/proposals'
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

  // The store decides whether this read-back has already been published, so the
  // promise holds no matter what the client does with it (ADR 0003).
  if (proposalId && !(await claimProposal(farmId, proposalId))) {
    return { written: 0, alreadyPublished: true }
  }

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
 * A harvest rule reaches storage the same way a movement does: he taps. A new
 * rule for a crop that already has one supersedes it — change, re-affirmation
 * and end are all the same write.
 */
export async function commitRules(farmId: string, proposed: ProposedRule[], proposalId?: string) {
  await requireFarmAccess(farmId)

  if (proposalId && !(await claimProposal(farmId, proposalId))) {
    return { written: 0, alreadyPublished: true }
  }

  const now = new Date()
  const standing = activeRules(await rulesForFarm(farmId), { now, freshnessDays: FRESHNESS_DAYS })
  const byProduct = new Map(standing.map((rule) => [rule.product, rule.id]))

  const rules = toRules(proposed, {
    farmId,
    proposalId,
    createdAt: now.toISOString(),
    newId: () => crypto.randomUUID(),
    currentRuleIdFor: (product) => byProduct.get(product),
  })

  await appendRules(rules)
  await Promise.all(
    proposed.map((item) => teach(farmId, item.heardAs, item.product.toLowerCase().trim())),
  )

  revalidatePath(`/f/${farmId}`)
  revalidatePath('/farm', 'layout')

  return { written: rules.length }
}

/**
 * "Sold out" — a removal with no number, which empties the position (ADR 0002).
 *
 * It used to be a true-up to zero with no unit, which the ledger reads as the
 * internal count unit. Against a crop he speaks of in pounds that is two units
 * for one crop, and a position counted two ways publishes as *available* — so
 * the one button we gave him for this job left the crop on his page and sent
 * him off to settle arithmetic he had never got wrong.
 */
export async function markSoldOut(farmId: string, product: string) {
  await appendPlain(farmId, product, {
    kind: 'remove',
    reason: 'sold',
    amountValue: null,
    amountUnit: null,
  })
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
        reason: null,
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
