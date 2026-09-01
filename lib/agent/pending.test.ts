import { describe, expect, it } from 'vitest'
import { latestPending } from './pending'
import type { FarmUIMessage } from './ui-message'

const movement = (product: string) => ({
  product,
  heardAs: product,
  rawPhrase: product,
  kind: 'trueup' as const,
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

  it('falls back to the earlier card when the latest is published', () => {
    const found = latestPending(
      [proposal('t1', 'tomatoes'), proposal('t2', 'peaches')],
      new Set(['t2']),
      {},
    )
    expect(found?.proposalId).toBe('t1')
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
