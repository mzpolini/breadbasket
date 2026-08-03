import { desc, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { notes, type NoteRow } from '../db/schema'

/**
 * The standing facts about a farm — everything he's said that isn't stock.
 *
 * Read newest-first because notes are append-only: when he changes his picking
 * days, both statements are on record and the recent one is the true one. The
 * caller takes from the top rather than reconciling.
 */

/** Newest first. `limit` bounds what reaches the model's context. */
export async function notesForFarm(farmId: string, limit = 20): Promise<NoteRow[]> {
  return getDb()
    .select()
    .from(notes)
    .where(eq(notes.farmId, farmId))
    .orderBy(desc(notes.createdAt))
    .limit(limit)
}

/**
 * Keep one thing he said. Blank notes are dropped rather than stored, so a
 * misfired tool call leaves no empty line in his context forever.
 */
export async function remember(farmId: string, note: string): Promise<void> {
  const text = note.trim()
  if (!text) return

  await getDb().insert(notes).values({
    id: crypto.randomUUID(),
    farmId,
    note: text,
    createdAt: new Date(),
  })
}
