import { describe, expect, it } from 'vitest'
import { latestPending, newestProposalId, publishOnSignal } from './pending'
import type { FarmUIMessage } from './ui-message'

const movement = (product: string) => ({
  product,
  heardAs: product,
  rawPhrase: product,
  kind: 'trueup' as const,
  reason: null,
  amountValue: 10,
  amountUnit: 'lb',
  measured: false,
  forecast: false,
  windowFrom: null,
  windowTo: null,
})

function proposal(toolCallId: string, product: string): FarmUIMessage {
  return {
    id: toolCallId,
    role: 'assistant',
    parts: [
      {
        type: 'tool-proposeMovements',
        toolCallId,
        state: 'output-available',
        input: { movements: [movement(product)] },
        output: { proposed: 1, movements: [movement(product)] },
      },
    ],
  } as unknown as FarmUIMessage
}

describe('latestPending', () => {
  it('finds the read-back waiting on him', () => {
    const found = latestPending([proposal('t1', 'tomatoes')], new Set(), {})
    expect(found).toMatchObject({ kind: 'movements', proposalId: 't1' })
  })

  it('is null when nothing is waiting', () => {
    expect(latestPending([], new Set(), {})).toBeNull()
  })

  it('a correction supersedes the card it corrected', () => {
    const found = latestPending(
      [proposal('t1', 'tomatoes'), proposal('t2', 'peaches')],
      new Set(),
      {},
    )
    expect(found?.proposalId).toBe('t2')
  })

  it('never re-publishes a card already in the ledger', () => {
    expect(latestPending([proposal('t1', 'tomatoes')], new Set(['t1']), {})).toBeNull()
  })

  it('never falls back to a card he corrected', () => {
    // t1 is the card he changed his mind about, t2 the correction he published.
    // Falling back to t1 is how nine movements he had rejected reached his
    // ledger a minute after the conversation moved on (ADR 0003).
    const found = latestPending(
      [proposal('t1', 'tomatoes'), proposal('t2', 'peaches')],
      new Set(['t2']),
      {},
    )
    expect(found).toBeNull()
  })

  it('publishes his edit, not what the agent first heard', () => {
    const edited = [movement('heirloom tomatoes')]
    const found = latestPending([proposal('t1', 'tomatoes')], new Set(), { t1: edited })
    expect(found).toMatchObject({ kind: 'movements', movements: edited })
  })

  it('ignores tool parts that are not read-backs', () => {
    const noise = {
      id: 'm',
      role: 'assistant',
      parts: [
        { type: 'tool-getCurrentStock', toolCallId: 'g1', state: 'output-available', output: { crops: [] } },
      ],
    } as unknown as FarmUIMessage
    expect(latestPending([noise], new Set(), {})).toBeNull()
  })

  it('finds a harvest rule read-back too', () => {
    const rules = {
      id: 'r',
      role: 'assistant',
      parts: [
        {
          type: 'tool-proposeHarvestRules',
          toolCallId: 'r1',
          state: 'output-available',
          output: { proposed: 1, rules: [{ product: 'watermelon' }] },
        },
      ],
    } as unknown as FarmUIMessage
    expect(latestPending([rules], new Set(), {})).toMatchObject({ kind: 'rules', proposalId: 'r1' })
  })
})

/**
 * A spoken yes, and only the one he is actually saying.
 *
 * The relay used to walk the whole transcript for publish signals, with its
 * "already acted on" set held in memory — so every remount replayed every
 * signal the conversation had ever contained, each publishing whatever card was
 * still outstanding. Nine rows he never approved.
 */
describe('publishOnSignal', () => {
  const signal = (toolCallId: string): FarmUIMessage =>
    ({
      id: toolCallId,
      role: 'assistant',
      parts: [{ type: 'tool-publishPending', toolCallId, state: 'output-available', output: { publish: true } }],
    }) as unknown as FarmUIMessage

  const said = (text: string): FarmUIMessage =>
    ({ id: text, role: 'user', parts: [{ type: 'text', text }] }) as unknown as FarmUIMessage

  it('publishes the card he is looking at when the agent hears a yes', () => {
    const relay = publishOnSignal(
      [proposal('t1', 'tomatoes'), said('yes'), signal('s1')],
      new Set(),
      {},
      new Set(),
    )

    expect(relay).toMatchObject({ signalId: 's1', target: { proposalId: 't1' } })
  })

  it('ignores a signal from an earlier turn, however the screen was reloaded', () => {
    const relay = publishOnSignal(
      [signal('s1'), said('remove okra'), proposal('t9', 'okra')],
      new Set(),
      {},
      new Set(),
    )

    expect(relay).toBeNull()
  })

  it('does not act twice on one yes', () => {
    const messages = [proposal('t1', 'tomatoes'), signal('s1')]
    expect(publishOnSignal(messages, new Set(), {}, new Set(['s1']))).toBeNull()
  })

  it('publishes nothing when the card he is being asked about is already up', () => {
    const relay = publishOnSignal(
      [proposal('t1', 'tomatoes'), signal('s1')],
      new Set(['t1']),
      {},
      new Set(),
    )

    expect(relay).toBeNull()
  })

  it('publishes nothing when there is no read-back waiting at all', () => {
    expect(publishOnSignal([signal('s1')], new Set(), {}, new Set())).toBeNull()
  })

  it('publishes his edit, not what the agent first heard', () => {
    const edited = [movement('heirloom tomatoes')]
    const relay = publishOnSignal(
      [proposal('t1', 'tomatoes'), signal('s1')],
      new Set(),
      { t1: edited },
      new Set(),
    )

    expect(relay?.target).toMatchObject({ movements: edited })
  })
})

/**
 * The same dead-card rule, reachable with a thumb instead of a yes. A card he
 * has talked past kept rendering its "Sounds good" button, so scrolling back up
 * could publish something he had already corrected.
 */
describe('newestProposalId', () => {
  it('is the last read-back he was shown', () => {
    expect(newestProposalId([proposal('t1', 'tomatoes'), proposal('t2', 'peaches')])).toBe('t2')
  })

  it('does not change once that read-back is published', () => {
    // Published or not, it is still the last thing he was shown — otherwise
    // publishing the newest card would bring an older one back to life.
    expect(newestProposalId([proposal('t1', 'tomatoes')])).toBe('t1')
  })

  it('is null when he has been shown nothing', () => {
    expect(newestProposalId([])).toBeNull()
  })
})
