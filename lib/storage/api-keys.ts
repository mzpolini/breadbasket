import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { apiKeys, apiRateWindows, type ApiKeyRow } from '../db/schema'

export async function insertApiKey(row: typeof apiKeys.$inferInsert): Promise<void> {
  await getDb().insert(apiKeys).values(row)
}

export async function findApiKeyByHash(hash: string): Promise<ApiKeyRow | null> {
  const result = await getDb().select().from(apiKeys).where(eq(apiKeys.keyHash, hash))
  return result[0] ?? null
}

export async function getApiKey(id: string): Promise<ApiKeyRow | null> {
  const result = await getDb().select().from(apiKeys).where(eq(apiKeys.id, id))
  return result[0] ?? null
}

/** Newest first, revoked ones included — the page says which is which. */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  return getDb().select().from(apiKeys).orderBy(desc(apiKeys.createdAt))
}

/**
 * Record that a key was used — but only if it hasn't been in the last minute,
 * decided in the `WHERE` so a busy consumer costs one write a minute, not one a
 * request.
 */
export async function touchApiKey(id: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - 60 * 1000)
  await getDb()
    .update(apiKeys)
    .set({ lastUsedAt: now })
    .where(and(eq(apiKeys.id, id), or(isNull(apiKeys.lastUsedAt), lt(apiKeys.lastUsedAt, cutoff))))
}

export async function markApiKeyRevoked(id: string, at: Date): Promise<void> {
  await getDb()
    .update(apiKeys)
    .set({ revokedAt: at })
    .where(and(eq(apiKeys.id, id), isNull(apiKeys.revokedAt)))
}

/**
 * Count one request against a key's current minute and return the count — one
 * statement, so two requests landing together can't both read the same number.
 */
export async function countRequest(keyId: string, windowStart: Date): Promise<number> {
  const [row] = await getDb()
    .insert(apiRateWindows)
    .values({ keyId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [apiRateWindows.keyId, apiRateWindows.windowStart],
      set: { count: sql`${apiRateWindows.count} + 1` },
    })
    .returning({ count: apiRateWindows.count })
  return row.count
}

export async function deleteWindowsBefore(cutoff: Date): Promise<void> {
  await getDb().delete(apiRateWindows).where(lt(apiRateWindows.windowStart, cutoff))
}
