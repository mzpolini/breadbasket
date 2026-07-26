import { asc, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { movements, type MovementRow } from '../db/schema'
import {
  COUNT_UNIT,
  type Movement,
  type MovementKind,
  type MovementSource,
  type MovementState,
} from '../ledger/types'

/**
 * The only way movements reach or leave storage.
 *
 * The mapping functions are pure and exported so they can be tested without a
 * database — a round-trip that silently drops `measured` or flattens a window
 * would corrupt every balance downstream, and that deserves a test rather than
 * trust.
 */

export function toMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    farmId: row.farmId,
    product: row.product,
    ...(row.rawPhrase ? { rawPhrase: row.rawPhrase } : {}),
    kind: row.kind as MovementKind,
    // Keyed off the *value* alone. A row with a number and no unit is a bare
    // count, not a corrupt row — requiring the pair is how the number used to
    // get thrown away on the way back out.
    ...(row.amountValue !== null
      ? { amount: { value: row.amountValue, unit: row.amountUnit ?? COUNT_UNIT } }
      : {}),
    measured: row.measured,
    ...(row.windowFrom && row.windowTo
      ? { window: { from: row.windowFrom, to: row.windowTo } }
      : {}),
    state: row.state as MovementState,
    source: row.source as MovementSource,
    sessionId: row.sessionId,
    occurredAt: row.occurredAt.toISOString(),
  }
}

/**
 * Returns the *select* shape rather than the insert shape: every column is set
 * explicitly, so the result is exactly what a read would give back — which is
 * what makes the round-trip testable in one line.
 */
export function toRow(movement: Movement): MovementRow {
  return {
    id: movement.id,
    farmId: movement.farmId,
    product: movement.product,
    rawPhrase: movement.rawPhrase ?? null,
    kind: movement.kind,
    amountValue: movement.amount?.value ?? null,
    amountUnit: movement.amount?.unit ?? null,
    measured: movement.measured,
    windowFrom: movement.window?.from ?? null,
    windowTo: movement.window?.to ?? null,
    state: movement.state,
    source: movement.source,
    sessionId: movement.sessionId,
    occurredAt: new Date(movement.occurredAt),
  }
}

/**
 * Everything ever said about one farm. The fold sorts by `occurredAt` itself —
 * it cannot inherit an ordering promise from storage — but returning them in
 * order anyway keeps the common path cheap.
 */
export async function movementsForFarm(farmId: string): Promise<Movement[]> {
  const rows = await getDb()
    .select()
    .from(movements)
    .where(eq(movements.farmId, farmId))
    .orderBy(asc(movements.occurredAt))

  return rows.map(toMovement)
}

/** Append-only. There is deliberately no update and no delete. */
export async function appendMovements(batch: Movement[]): Promise<void> {
  if (batch.length === 0) return
  await getDb().insert(movements).values(batch.map(toRow)).onConflictDoNothing()
}
