'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useTransition } from 'react'
import { commitProposed } from '@/app/farm/[secret]/actions'
import { EditSheet } from './edit-sheet'
import { ReadBackList, type ReadBackRow } from './read-back-row'
import type { ProposedMovement } from '@/lib/agent/tools'

/**
 * The conversation, and the read-back that comes out of it.
 *
 * The agent proposes; nothing is written until he taps. That boundary is the
 * product's central promise, so it lives in the interface rather than in a
 * prompt: there is no code path here that publishes without a tap.
 *
 * Corrections are held locally against the tool call that produced them, so what
 * gets committed is what he saw and fixed — never what the model originally
 * guessed.
 */
export function Chat({ verbose }: { verbose: boolean }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })
  const [input, setInput] = useState('')
  const [drafts, setDrafts] = useState<Record<string, ProposedMovement[]>>({})
  const [committed, setCommitted] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ key: string; index: number } | null>(null)
  const [pending, startTransition] = useTransition()

  const busy = status === 'submitted' || status === 'streaming'
  const editingMovement = editing ? drafts[editing.key]?.[editing.index] : undefined

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 space-y-5 px-4 pb-6 pt-8">
        {messages.length === 0 && <ColdStart />}

        {messages.map((message) =>
          message.parts.map((part, i) => {
            const key = `${message.id}-${i}`

            if (part.type === 'text') {
              return (
                <Bubble key={key} from={message.role === 'user' ? 'him' : 'agent'}>
                  {part.text}
                </Bubble>
              )
            }

            // The read-back — the only place a movement can become public.
            if (part.type === 'tool-proposeMovements' && 'output' in part && part.output) {
              const output = part.output as { movements: ProposedMovement[] }
              const movements = drafts[key] ?? output.movements
              const done = committed.has(key)

              return (
                <div key={key} className="space-y-3">
                  <ReadBackList
                    rows={movements.map(toRow)}
                    onEdit={
                      done
                        ? undefined
                        : (index) => {
                            setDrafts((d) => ({ ...d, [key]: d[key] ?? output.movements }))
                            setEditing({ key, index })
                          }
                    }
                  />
                  {done ? (
                    <p className="meta text-[13px]" style={{ color: 'var(--color-accent-2-700)' }}>
                      It&rsquo;s up. Everything here expires, so it comes down on its own.
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={pending}
                        className="btn btn-primary"
                        onClick={() =>
                          startTransition(async () => {
                            await commitProposed(movements)
                            setCommitted((s) => new Set(s).add(key))
                          })
                        }
                      >
                        Put it up
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setInput('Not quite — ')}
                      >
                        Fix something
                      </button>
                    </div>
                  )}
                </div>
              )
            }

            // The machinery, at higher verbosity. Farm language, not logs.
            if (verbose && part.type.startsWith('tool-')) {
              return (
                <p
                  key={key}
                  className="meta text-[12px]"
                  style={{ color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }}
                >
                  {narrate(part.type)}
                </p>
              )
            }

            return null
          }),
        )}

        {busy && (
          <p
            className="meta text-[12px]"
            style={{ color: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }}
          >
            reading what you wrote…
          </p>
        )}
      </div>

      <form
        className="sticky bottom-0 flex gap-2 px-4 py-3"
        style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-divider)' }}
        onSubmit={(e) => {
          e.preventDefault()
          if (!input.trim() || busy) return
          sendMessage({ text: input })
          setInput('')
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="what have you got?"
          className="flex-1 rounded-full px-4 py-3 text-[16px]"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)' }}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary">
          Send
        </button>
      </form>

      {editing && editingMovement && (
        <EditSheet
          movement={editingMovement}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setDrafts((d) => ({
              ...d,
              [editing.key]: (d[editing.key] ?? []).map((m, i) =>
                i === editing.index ? next : m,
              ),
            }))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ColdStart() {
  return (
    <div className="space-y-3 pb-4">
      <Bubble from="agent">
        This is BreadBasket. Tell me what you&rsquo;ve got on the farm right now &mdash;
        however you&rsquo;d say it to a customer. I&rsquo;ll show you what I heard before
        anything goes public.
      </Bubble>
    </div>
  )
}

function Bubble({ from, children }: { from: 'him' | 'agent'; children: React.ReactNode }) {
  const mine = from === 'him'
  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <p
        className="max-w-[85%] whitespace-pre-wrap rounded-[22px] px-4 py-3 text-[16px] leading-[1.5]"
        style={{
          background: mine ? 'var(--color-accent-200)' : 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      >
        {children}
      </p>
    </div>
  )
}

/** Kind first, then confidence — the order the read-back depends on. */
function toRow(movement: ProposedMovement): ReadBackRow {
  const kindWord =
    movement.kind === 'trueup'
      ? 'total'
      : movement.kind === 'add'
        ? 'added'
        : movement.kind === 'remove'
          ? 'sold'
          : 'spoiled'

  const soldOut = movement.kind === 'trueup' && movement.amountValue === 0

  const figure = soldOut
    ? 'none left'
    : movement.amountValue === null
      ? 'available'
      : `${movement.measured ? '' : '~'}${movement.amountValue}${
          movement.amountUnit ? ` ${movement.amountUnit}` : ''
        }`

  const chip =
    movement.kind === 'add'
      ? ('added' as const)
      : movement.kind === 'remove'
        ? ('sold' as const)
        : movement.kind === 'spoil'
          ? ('spoiled' as const)
          : undefined

  const meta = movement.forecast
    ? `not yet · ready ${movement.windowFrom ?? 'later'}`
    : soldOut
      ? 'sold out'
      : movement.amountValue === null
        ? `${kindWord} · no amount, and that's fine`
        : `${kindWord} · ${movement.measured ? 'weighed' : 'estimated'}`

  return {
    product: movement.product,
    figure,
    ...(chip ? { chip } : {}),
    tone: movement.forecast
      ? 'forecast'
      : soldOut
        ? 'spent'
        : movement.amountValue === null
          ? 'available'
          : 'normal',
    meta,
  }
}

function narrate(type: string): string {
  if (type.includes('getCurrentStock')) return 'looked at what you already have'
  if (type.includes('resolveProducts')) return 'matched it to your crops'
  if (type.includes('proposeMovements')) return 'wrote up what I heard'
  return type
}
