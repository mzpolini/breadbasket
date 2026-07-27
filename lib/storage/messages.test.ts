import { describe, expect, it } from 'vitest'
import type { FarmUIMessage } from '../agent/ui-message'
import type { MessageRow } from '../db/schema'
import { recentForContext, toMessageRow, toUIMessage } from './messages'

/**
 * The round trip, not the database.
 *
 * A transcript that loses its tool parts still *looks* fine — the text is all
 * there — while the read-back cards silently vanish on reload, which is the one
 * thing persisting the conversation was meant to prevent.
 */

const withCard: FarmUIMessage = {
  id: 'msg-1',
  role: 'assistant',
  parts: [
    { type: 'text', text: 'Here is what I heard.' },
    {
      type: 'tool-proposeMovements',
      toolCallId: 'call-1',
      state: 'output-available',
      input: {},
      output: { movements: [{ product: 'tomatoes', amountValue: 40 }] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  ],
}

const row = (over: Partial<MessageRow> = {}): MessageRow => ({
  id: 'msg-1',
  farmId: 'farm-1',
  role: 'assistant',
  parts: withCard.parts,
  seq: 1,
  createdAt: new Date('2026-07-26T09:00:00.000Z'),
  ...over,
})

const text = (id: string, role: 'user' | 'assistant'): FarmUIMessage => ({
  id,
  role,
  parts: [{ type: 'text', text: id }],
})

describe('message round trip', () => {
  it('preserves a plain text message', () => {
    const message = text('msg-9', 'user')
    expect(toUIMessage(toMessageRow('farm-1', message, new Date()))).toEqual(message)
  })

  it('preserves tool parts, so read-back cards survive a reload', () => {
    const back = toUIMessage(row())
    expect(back.parts).toHaveLength(2)
    expect(back.parts[1]).toMatchObject({
      type: 'tool-proposeMovements',
      toolCallId: 'call-1',
    })
  })

  it('keeps the message id, so re-saving a turn updates rather than duplicates', () => {
    expect(toMessageRow('farm-1', text('msg-7', 'user'), new Date()).id).toBe('msg-7')
  })

  it('scopes the row to the farm', () => {
    expect(toMessageRow('farm-2', text('msg-7', 'user'), new Date()).farmId).toBe('farm-2')
  })
})

describe('recentForContext', () => {
  const conversation = Array.from({ length: 30 }, (_, i) =>
    text(`msg-${i}`, i % 2 === 0 ? 'user' : 'assistant'),
  )

  it('sends only a recent window to the model, not the whole history', () => {
    expect(recentForContext(conversation, 10)).toHaveLength(10)
  })

  it('keeps the most recent messages — the end of the conversation, not the start', () => {
    const kept = recentForContext(conversation, 4)
    expect(kept.map((m) => m.id)).toEqual(['msg-26', 'msg-27', 'msg-28', 'msg-29'])
  })

  it('passes a short conversation through untouched', () => {
    const short = conversation.slice(0, 3)
    expect(recentForContext(short, 10)).toEqual(short)
  })

  it('never returns an empty context when a limit of zero is asked for', () => {
    // A model call with no messages is an error, not an empty conversation.
    expect(recentForContext(conversation, 0)).toHaveLength(1)
  })
})
