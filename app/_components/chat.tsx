'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { commitProposed, commitRules } from '@/app/farm/[farmId]/actions'
import { COUNT_UNIT, formatAmount } from '@/lib/ledger'
import { EditSheet } from './edit-sheet'
import { newestProposalId, publishOnSignal, type Pending } from '@/lib/agent/pending'
import type { ProposedMovement, ProposedRule } from '@/lib/agent/tools'
import type { FarmUIMessage } from '@/lib/agent/ui-message'

/**
 * Surface 1, following design `1a`.
 *
 * The details are the design's and they matter: bubbles carry asymmetric radii so
 * the tail points at who spoke; the farmer's are full accent with white text
 * because his own words should read as the loudest thing on screen; and the
 * machinery sits *inline* in the flow behind a sage rule rather than in a panel,
 * because it is the conversation with more of itself shown, not a log.
 *
 * The publish question lives inside the read-back card. That is deliberate — the
 * question and the thing being agreed to are one object, so there is no way to
 * tap "Put it up" without the rows being in view.
 *
 * The agent proposes; nothing is written until he taps. No code path here
 * publishes without one.
 */
export function Chat({
  verbose,
  initialMessages,
  publishedProposals,
  farmId,
}: {
  verbose: boolean
  initialMessages: FarmUIMessage[]
  /** Tool-call ids already in the ledger, so a reload cannot double-publish. */
  publishedProposals: string[]
  farmId: string
}) {
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Only the new message goes over the wire. The server holds the
      // transcript and decides how much of it the model gets to see.
      prepareSendMessagesRequest: ({ messages: all }) => ({
        body: { message: all[all.length - 1], farmId },
      }),
    }),
  })
  const [input, setInput] = useState('')
  const [drafts, setDrafts] = useState<Record<string, ProposedMovement[]>>({})
  const [committed, setCommitted] = useState<Set<string>>(new Set(publishedProposals))
  const [editing, setEditing] = useState<{ key: string; index: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const scroller = useRef<HTMLDivElement>(null)
  /** Publish signals already acted on, so a re-render cannot write twice. */
  const relayed = useRef<Set<string>>(new Set())

  const busy = status === 'submitted' || status === 'streaming'
  /**
   * The only card that may still be published. Anything above it he has talked
   * past — a correction supersedes the card it corrected, and a superseded card
   * must be as dead to his thumb as it is to a spoken yes (ADR 0003).
   */
  const live = newestProposalId(messages)
  const editingMovement = editing ? drafts[editing.key]?.[editing.index] : undefined

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const publish = useCallback(
    (target: Pending) =>
      startTransition(async () => {
        if (target.kind === 'movements') {
          await commitProposed(farmId, target.movements, target.proposalId)
        } else {
          await commitRules(farmId, target.rules, target.proposalId)
        }
        setCommitted((s) => new Set(s).add(target.proposalId))
      }),
    [farmId],
  )

  /**
   * A spoken yes, honoured.
   *
   * The agent cannot write; when he says "yes" it calls `publishPending`, and
   * this publishes **the card on screen** through the same action the button
   * uses. So the words and the tap end in exactly the same place, and nothing
   * he hasn't seen read back can reach the ledger.
   *
   * Which yes counts is decided in `publishOnSignal`, not here. This effect
   * re-runs on a reload with the whole transcript restored, and the rule that
   * only the live turn can publish is what stops that reload acting on every
   * yes the conversation has ever contained (ADR 0003).
   */
  useEffect(() => {
    const relay = publishOnSignal(messages, committed, drafts, relayed.current)
    if (!relay) return

    relayed.current.add(relay.signalId)
    publish(relay.target)
  }, [messages, committed, drafts, publish])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={scroller}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-[18px] pb-2 pt-[18px]"
      >
        {messages.length === 0 && (
          <Bubble from="agent">
            This is BreadBasket. Tell me what you&rsquo;ve got on the farm right now
            &mdash; however you&rsquo;d say it to a customer. I&rsquo;ll show you what I
            heard before anything goes public.
          </Bubble>
        )}

        {messages.map((message) =>
          message.parts.map((part, i) => {
            const key = `${message.id}-${i}`

            if (part.type === 'text') {
              if (!part.text.trim()) return null
              return (
                <Bubble key={key} from={message.role === 'user' ? 'him' : 'agent'}>
                  {part.text}
                </Bubble>
              )
            }

            if (part.type === 'tool-proposeMovements' && 'output' in part && part.output) {
              const output = part.output as { movements: ProposedMovement[] }
              // Keyed on the tool-call id, not the render index: this is what the
              // ledger stores as `proposalId`, so it is the one identifier that
              // survives a reload and can say "you already published this".
              const proposalId = (part as { toolCallId?: string }).toolCallId ?? key
              const movements = drafts[proposalId] ?? output.movements
              const done = committed.has(proposalId)

              return (
                <ReadBackCard
                  key={key}
                  movements={movements}
                  done={done}
                  superseded={!done && proposalId !== live}
                  pending={pending}
                  onEdit={(index) => {
                    setDrafts((d) => ({ ...d, [proposalId]: d[proposalId] ?? output.movements }))
                    setEditing({ key: proposalId, index })
                  }}
                  onPublish={() => publish({ kind: 'movements', proposalId, movements })}
                  onFix={() => setInput('Not quite — ')}
                />
              )
            }

            if (part.type === 'tool-proposeHarvestRules' && 'output' in part && part.output) {
              const output = part.output as { rules: ProposedRule[] }
              const proposalId = (part as { toolCallId?: string }).toolCallId ?? key
              const done = committed.has(proposalId)

              return (
                <RuleCard
                  key={key}
                  rules={output.rules}
                  done={done}
                  superseded={!done && proposalId !== live}
                  pending={pending}
                  onPublish={() => publish({ kind: 'rules', proposalId, rules: output.rules })}
                  onFix={() => setInput('Not quite — ')}
                />
              )
            }

            if (verbose && part.type.startsWith('tool-')) {
              return <Step key={key} type={part.type} />
            }

            return null
          }),
        )}

        {busy && <Step type="thinking" />}
      </div>

      <form
        className="flex flex-none items-center gap-2 px-[18px] pb-4 pt-3"
        style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)',
        }}
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
          className="min-w-0 flex-1 rounded-full px-[17px] py-[13px] text-[15.5px]"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid color-mix(in srgb, var(--color-text) 12%, transparent)',
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="btn btn-primary flex-none"
          style={{ padding: '13px 20px', fontSize: 15.5 }}
        >
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
              [editing.key]: (d[editing.key] ?? []).map((m, i) => (i === editing.index ? next : m)),
            }))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/** Tail points at who spoke — the design's asymmetric radii. */
function Bubble({ from, children }: { from: 'him' | 'agent'; children: React.ReactNode }) {
  const mine = from === 'him'
  return (
    <div
      className="max-w-[88%] whitespace-pre-wrap px-[17px] py-[14px] text-[15.5px] leading-[1.5] text-pretty"
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        background: mine ? 'var(--color-accent)' : 'var(--color-surface)',
        color: mine ? '#fff' : 'var(--color-text)',
        borderRadius: mine ? '22px 22px 8px 22px' : '22px 22px 22px 8px',
      }}
    >
      {children}
    </div>
  )
}

/**
 * The machinery, inline. Sage rule, a status dot, and farm language — no JSON,
 * no ids, no "200 OK". Negative margin pulls it in tight against the bubbles so
 * it reads as part of the conversation rather than an aside.
 */
function Step({ type }: { type: string }) {
  const { label, detail, tone } = describe(type)

  return (
    <div
      className="flex items-start gap-[9px] self-stretch py-[1px] pl-[14px]"
      style={{ borderLeft: '2px solid var(--color-accent-2-300)', margin: '-8px 0' }}
    >
      <span
        className="mt-[6px] h-[7px] w-[7px] flex-none"
        style={{
          background: tone === 'warn' ? 'var(--color-accent-500, #d67f48)' : '#8fa073',
          borderRadius: tone === 'fail' ? 2 : 999,
        }}
      />
      <div className="flex flex-col gap-[1px]">
        <span
          className="meta text-[11px] font-semibold leading-[1.3] tracking-[.04em]"
          style={{ color: 'var(--color-accent-2-700)' }}
        >
          {label}
        </span>
        <span
          className="text-[12px] leading-[1.45]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}
        >
          {detail}
        </span>
      </div>
    </div>
  )
}

function describe(type: string): { label: string; detail: string; tone: 'ok' | 'warn' | 'fail' } {
  if (type === 'thinking') {
    return { label: 'READING WHAT YOU WROTE', detail: 'one moment', tone: 'ok' }
  }
  if (type.includes('getCurrentStock')) {
    return { label: 'WHAT YOU ALREADY HAVE', detail: 'looked at your book first', tone: 'ok' }
  }
  if (type.includes('resolveProducts')) {
    return { label: 'MATCHED IT TO YOUR CROPS', detail: 'using your words for them', tone: 'ok' }
  }
  if (type.includes('proposeMovements')) {
    return { label: 'WROTE UP WHAT I HEARD', detail: 'nothing published yet', tone: 'ok' }
  }
  if (type.includes('proposeHarvestRules')) {
    return { label: 'HEARD A RHYTHM', detail: 'a rule, not stock · nothing published yet', tone: 'ok' }
  }
  if (type.includes('publishPending')) {
    return { label: 'YOU SAID YES', detail: 'putting up the card you were shown', tone: 'ok' }
  }
  if (type.includes('rememberAboutFarm')) {
    return { label: 'NOTED ABOUT THE FARM', detail: 'kept, never shown to buyers', tone: 'ok' }
  }
  return { label: type, detail: '', tone: 'warn' }
}

/**
 * The read-back. The publish question sits inside the card so the rows and the
 * thing he is agreeing to cannot be separated.
 */
function ReadBackCard({
  movements,
  done,
  superseded,
  pending,
  onEdit,
  onPublish,
  onFix,
}: {
  movements: ProposedMovement[]
  done: boolean
  /** He corrected this after it was shown. Nothing here may be published. */
  superseded: boolean
  pending: boolean
  onEdit: (index: number) => void
  onPublish: () => void
  onFix: () => void
}) {
  return (
    <div
      className="self-stretch overflow-hidden rounded-[24px]"
      style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-md)' }}
    >
      {movements.map((movement, index) => (
        <Row
          key={`${movement.product}-${index}`}
          movement={movement}
          onEdit={done || superseded ? undefined : () => onEdit(index)}
        />
      ))}

      <div className="flex flex-col gap-[13px] px-[18px] pb-[19px] pt-[17px]">
        {done ? (
          <span
            className="meta text-[12.5px] leading-[1.5]"
            style={{ color: 'var(--color-accent-2-700)' }}
          >
            It&rsquo;s up. Everything here expires, so it comes down on its own.
          </span>
        ) : superseded ? (
          <Superseded />
        ) : (
          // No question above the buttons: the rows are the question, and the
          // buttons answer it. Asking it in words was one line of noise on a
          // screen he reads one-handed.
          <div className="flex gap-[10px]">
            <button
              type="button"
              disabled={pending}
              onClick={onPublish}
              className="btn btn-primary flex-1"
              style={{ fontSize: 15.5, padding: '15px 18px' }}
            >
              Sounds good
            </button>
            <button
              type="button"
              onClick={onFix}
              className="btn btn-secondary"
              style={{ fontSize: 15.5, padding: '15px 18px' }}
            >
              Fix something
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * What a card he has talked past says instead of offering to publish.
 *
 * It stays on screen rather than disappearing — it is part of the conversation,
 * and he should be able to see what he changed his mind about. It simply can no
 * longer be published, by thumb or by word.
 */
function Superseded() {
  return (
    <span
      className="meta text-[12.5px] leading-[1.5]"
      style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
    >
      You changed this after I showed it. The newer one is the one that counts.
    </span>
  )
}

/**
 * How a loss reads back to him, in his register rather than ours. He never sees
 * the word "wildlife" — he sees what he told us.
 */
const LOSS_WORD: Record<NonNullable<ProposedMovement['reason']>, string> = {
  sold: 'sold',
  spoiled: 'went bad',
  wildlife: 'lost to deer or birds',
  pests: 'lost to pests',
  weather: 'lost to weather',
  donated: 'given away',
  'own-use': 'kept back',
  other: 'gone',
}

function Row({
  movement,
  onEdit,
}: {
  movement: ProposedMovement
  onEdit?: () => void
}) {
  // A reduction he gave no number for empties the position (ADR 0002), so the
  // row has to read as the outcome — "none left" — and not as a change. He
  // approves what this says; if it says anything else the ledger and the card
  // disagree, which is the failure the read-back exists to prevent.
  const emptied = movement.kind === 'remove' && movement.amountValue === null
  const nothingLeft = emptied || (movement.kind === 'trueup' && movement.amountValue === 0)
  const lossWord = movement.reason ? LOSS_WORD[movement.reason] : 'gone'
  const kindWord =
    movement.kind === 'trueup' ? 'total' : movement.kind === 'add' ? 'added' : lossWord

  // Formatted the same way the ledger will format it once committed, so the
  // read-back and the stock page can never word the same figure differently.
  const figure = nothingLeft
    ? 'none left'
    : movement.amountValue === null
      ? 'available'
      : `${movement.measured ? '' : '~'}${formatAmount({
          value: movement.amountValue,
          unit: movement.amountUnit?.trim() || COUNT_UNIT,
        })}`

  const meta = movement.forecast
    ? `not yet · ready ${movement.windowFrom ?? 'later'}`
    : emptied
      ? `${lossWord} · off your page`
      : nothingLeft
        ? 'sold out'
        : movement.amountValue === null
          ? `${kindWord} · no amount, and that's fine`
          : `${kindWord} · ${movement.measured ? 'weighed' : 'estimated'}`

  const figureColour = movement.forecast
    ? 'var(--color-accent-2-700)'
    : nothingLeft
      ? 'color-mix(in srgb, var(--color-text) 45%, transparent)'
      : movement.amountValue === null
        ? 'var(--color-accent-2-700)'
        : 'var(--color-text)'

  return (
    <div
      className="flex flex-col gap-[5px] px-[18px] py-[15px]"
      style={{
        borderBottom: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
        // A forecast never enters the black-ink column where current stock lives.
        borderLeft: movement.forecast ? '4px solid var(--color-accent-2-300)' : undefined,
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="flex-1 text-[16.5px] font-semibold capitalize leading-[1.25]">
          {movement.product}
        </span>
        <span className="tnum text-[16.5px] leading-[1.25]" style={{ color: figureColour }}>
          {figure}
        </span>
      </div>
      <div className="flex items-center gap-[10px]">
        <span
          className="meta flex-1 text-[12.5px] leading-[1.4]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}
        >
          {meta}
        </span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost"
            style={{ fontSize: 12.5, padding: '8px 14px' }}
          >
            edit
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * The read-back for a harvest rule. Sage-edged like a forecast row, because a
 * rule is never stock — and the sentence is shown whole, because the sentence
 * is exactly what a buyer will read under "coming soon".
 */
function RuleCard({
  rules,
  done,
  superseded,
  pending,
  onPublish,
  onFix,
}: {
  rules: ProposedRule[]
  done: boolean
  superseded: boolean
  pending: boolean
  onPublish: () => void
  onFix: () => void
}) {
  return (
    <div
      className="self-stretch overflow-hidden rounded-[24px]"
      style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-md)' }}
    >
      {rules.map((rule, index) => (
        <div
          key={`${rule.product}-${index}`}
          className="flex flex-col gap-[5px] px-[18px] py-[15px]"
          style={{
            borderBottom: '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)',
            borderLeft: '4px solid var(--color-accent-2-300)',
          }}
        >
          <div className="flex items-baseline gap-3">
            <span className="flex-1 text-[16.5px] font-semibold capitalize leading-[1.25]">
              {rule.product}
            </span>
            <span
              className="meta text-[12.5px] leading-[1.25]"
              style={{ color: 'var(--color-accent-2-700)' }}
            >
              {rule.ended ? 'done' : rule.interval === 'weekly' ? 'every week' : rule.interval}
              {!rule.ended && rule.endsOn ? ` · through ${rule.endsOn}` : ''}
            </span>
          </div>
          <span
            className="text-[13.5px] leading-[1.45]"
            style={{ color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}
          >
            {rule.ended ? 'Comes off your page.' : `Buyers will read: “${rule.rawPhrase}”`}
          </span>
        </div>
      ))}

      <div className="flex flex-col gap-[13px] px-[18px] pb-[19px] pt-[17px]">
        {done ? (
          <span
            className="meta text-[12.5px] leading-[1.5]"
            style={{ color: 'var(--color-accent-2-700)' }}
          >
            Noted as coming soon. It&rsquo;s a rhythm, not stock &mdash; tell me when you
            actually pick.
          </span>
        ) : superseded ? (
          <Superseded />
        ) : (
          <div className="flex gap-[10px]">
            <button
              type="button"
              disabled={pending}
              onClick={onPublish}
              className="btn btn-primary flex-1"
              style={{ fontSize: 15.5, padding: '15px 18px' }}
            >
              Sounds good
            </button>
            <button
              type="button"
              onClick={onFix}
              className="btn btn-secondary"
              style={{ fontSize: 15.5, padding: '15px 18px' }}
            >
              Fix something
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
