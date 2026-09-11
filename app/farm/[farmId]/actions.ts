'use server'

import { revalidatePath } from 'next/cache'
import { soldOut, toMovements, toRules } from '@/lib/agent/commit'
import type { ProposedMovement, ProposedRule } from '@/lib/agent/tools'
import { activeRules } from '@/lib/cadence'
import { FRESHNESS_DAYS } from '@/lib/seed'
import { appendRules, rulesForFarm } from '@/lib/storage/harvest-rules'
import { requireFarmAccess } from '@/lib/auth/current-user'
import { appendMovements } from '@/lib/storage/movements'
import { publishOnce, releasePublish } from '@/lib/storage/proposals'
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
  if (proposalId && !(await publishOnce(farmId, proposalId))) {
    return { written: 0, alreadyPublished: true }
  }

  const movements = toMovements(proposed, {
    farmId,
    sessionId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    proposalId,
    newId: () => crypto.randomUUID(),
  })

  await write(farmId, proposalId, () => appendMovements(movements))

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

  if (proposalId && !(await publishOnce(farmId, proposalId))) {
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

  await write(farmId, proposalId, () => appendRules(rules))
  await Promise.all(
    proposed.map((item) => teach(farmId, item.heardAs, item.product.toLowerCase().trim())),
  )

  revalidatePath(`/f/${farmId}`)
  revalidatePath('/farm', 'layout')

  return { written: rules.length }
}

/** "Sold out" — the shape of it, and why, is in `soldOut`. */
export async function markSoldOut(farmId: string, product: string) {
  await requireFarmAccess(farmId)

  await appendMovements(
    toMovements([soldOut(product)], {
      farmId,
      sessionId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    }),
  )

  revalidatePath(`/f/${farmId}`)
  revalidatePath('/farm', 'layout')

  return { soldOut: product }
}

/**
 * Runs the write that a recorded publish promised.
 *
 * If it fails, the record is handed back — otherwise the read-back is marked
 * published with nothing behind it, and his card is dead with no stock written.
 * Two round trips rather than one transaction because the driver speaks HTTP.
 */
async function write(farmId: string, proposalId: string | undefined, append: () => Promise<void>) {
  try {
    await append()
  } catch (error) {
    if (proposalId) await releasePublish(farmId, proposalId)
    throw error
  }
}
