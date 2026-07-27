import type { FarmUIMessage } from '../agent/ui-message'
import { asc, eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { messages, type MessageRow } from '../db/schema'

/**
 * The conversation, stored and read back.
 *
 * Kept in `useChat`'s own UIMessage shape rather than flattened to text, because
 * the parts *are* the conversation: a read-back card is a tool part, and a
 * transcript that drops it loses the only artefact he was asked to agree to.
 *
 * The mapping functions are pure and exported so the round trip can be tested
 * without a database — the failure mode here is silent, since a transcript that
 * lost its cards still reads perfectly well.
 */

export function toMessageRow(
  farmId: string,
  message: FarmUIMessage,
  createdAt: Date,
): MessageRow {
  return {
    id: message.id,
    farmId,
    role: message.role,
    parts: message.parts,
    // Assigned by the database on insert; carried here so the mapper returns the
    // select shape and the round trip is testable in one line.
    seq: 0,
    createdAt,
  }
}

export function toUIMessage(row: MessageRow): FarmUIMessage {
  return {
    id: row.id,
    role: row.role as FarmUIMessage['role'],
    parts: row.parts as FarmUIMessage['parts'],
  }
}

/**
 * What the model is allowed to see.
 *
 * The transcript is a **record, not the agent's memory** — what the farm has is
 * folded from movements, and the agent reads that with `getCurrentStock`. So the
 * whole history never needs to reach the context, and shouldn't: it grows
 * without bound, costs money on every turn, and buries the sentence he just
 * typed under six weeks of small talk.
 *
 * Never returns nothing: a model call with an empty message list is an error,
 * not an empty conversation.
 */
export function recentForContext(all: FarmUIMessage[], limit: number): FarmUIMessage[] {
  if (all.length <= limit) return all
  return all.slice(-Math.max(1, limit))
}

/** Everything ever said on this farm, oldest first. */
export async function messagesForFarm(farmId: string): Promise<FarmUIMessage[]> {
  const rows = await getDb()
    .select()
    .from(messages)
    .where(eq(messages.farmId, farmId))
    .orderBy(asc(messages.seq))

  return rows.map(toUIMessage)
}

/**
 * Upserts on the message id, so re-saving a whole turn is idempotent — which is
 * what the SDK's `onEnd` hands us, and what a retried request would repeat.
 */
export async function saveMessages(farmId: string, batch: FarmUIMessage[]): Promise<void> {
  if (batch.length === 0) return

  const now = new Date()
  await getDb()
    .insert(messages)
    .values(
      // `seq` is assigned by the database, so it is dropped from the insert.
      batch.map(({ ...message }) => {
        const row = toMessageRow(farmId, message, now)
        return {
          id: row.id,
          farmId: row.farmId,
          role: row.role,
          parts: row.parts,
          createdAt: row.createdAt,
        }
      }),
    )
    // Only `parts` changes on a re-save: a turn's role and creation time are
    // fixed the moment it happens, but the content streams in.
    .onConflictDoUpdate({
      target: messages.id,
      set: { parts: sql`excluded.parts` },
    })
}
