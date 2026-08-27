import { asc, eq } from 'drizzle-orm'
import type { HarvestRule } from '../cadence'
import { getDb } from '../db'
import { harvestRules, type HarvestRuleRow } from '../db/schema'

/** The only way harvest rules reach or leave storage. Append-only, like the ledger. */

export function toRule(row: HarvestRuleRow): HarvestRule {
  return {
    id: row.id,
    farmId: row.farmId,
    product: row.product,
    rawPhrase: row.rawPhrase,
    ...(row.amountValue !== null
      ? { amount: { value: row.amountValue, unit: row.amountUnit ?? 'count' } }
      : {}),
    interval: row.interval,
    ...(row.startsOn ? { startsOn: row.startsOn } : {}),
    ...(row.endsOn ? { endsOn: row.endsOn } : {}),
    ended: row.ended,
    ...(row.supersedesId ? { supersedesId: row.supersedesId } : {}),
    ...(row.proposalId ? { proposalId: row.proposalId } : {}),
    createdAt: row.createdAt.toISOString(),
  }
}

export function toRuleRow(rule: HarvestRule): HarvestRuleRow {
  return {
    id: rule.id,
    farmId: rule.farmId,
    product: rule.product,
    rawPhrase: rule.rawPhrase,
    amountValue: rule.amount?.value ?? null,
    amountUnit: rule.amount?.unit ?? null,
    interval: rule.interval,
    startsOn: rule.startsOn ?? null,
    endsOn: rule.endsOn ?? null,
    ended: rule.ended,
    supersedesId: rule.supersedesId ?? null,
    proposalId: rule.proposalId ?? null,
    createdAt: new Date(rule.createdAt),
  }
}

export async function rulesForFarm(farmId: string): Promise<HarvestRule[]> {
  const rows = await getDb()
    .select()
    .from(harvestRules)
    .where(eq(harvestRules.farmId, farmId))
    .orderBy(asc(harvestRules.createdAt))
  return rows.map(toRule)
}

export async function appendRules(batch: HarvestRule[]): Promise<void> {
  if (batch.length === 0) return
  await getDb().insert(harvestRules).values(batch.map(toRuleRow)).onConflictDoNothing()
}

/** Read-backs already written as rules, so a reload cannot offer them again. */
export async function publishedRuleProposals(farmId: string): Promise<string[]> {
  const rows = await getDb()
    .selectDistinct({ proposalId: harvestRules.proposalId })
    .from(harvestRules)
    .where(eq(harvestRules.farmId, farmId))
  return rows.flatMap((row) => (row.proposalId ? [row.proposalId] : []))
}
