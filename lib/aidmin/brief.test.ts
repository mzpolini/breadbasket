import { describe, expect, it } from 'vitest'
import {
  DEMO_FARM_ID,
  disposition,
  isReviewableFarm,
  renderSessions,
  spokenText,
  type SessionFarm,
} from './brief'

const at = (iso: string) => new Date(iso)

describe('spokenText', () => {
  it('keeps what was said and drops the tool machinery', () => {
    expect(
      spokenText([
        { type: 'step-start' },
        { type: 'tool-proposeMovements', input: { movements: [] } },
        { type: 'text', text: "Here's what I heard." },
      ]),
    ).toBe("Here's what I heard.")
  })

  it('is empty when a turn has no words', () => {
    expect(spokenText([{ type: 'tool-publishPending' }])).toBe('')
    expect(spokenText(null)).toBe('')
  })
})

describe('isReviewableFarm', () => {
  it('leaves the scripted demo farm out', () => {
    expect(isReviewableFarm(DEMO_FARM_ID)).toBe(false)
    expect(isReviewableFarm('farm_real')).toBe(true)
  })
})

describe('disposition', () => {
  it('always writes the daily briefing, and marks it an emergency when someone is stuck', () => {
    expect(disposition('daily', 'calm', true)).toBe('daily')
    expect(disposition('daily', 'emergency', true)).toBe('emergency')
    expect(disposition('daily', 'calm', false)).toBe('daily')
  })

  it('a scan stays quiet unless someone is stuck', () => {
    expect(disposition('scan', 'calm', true)).toBe('skip')
    expect(disposition('scan', 'watch', true)).toBe('skip')
    expect(disposition('scan', 'emergency', true)).toBe('emergency')
    expect(disposition('scan', 'calm', false)).toBe('skip')
  })
})

describe('renderSessions', () => {
  it('names the farm, the words, and what the ledger kept', () => {
    const farm: SessionFarm = {
      farmId: 'farm_a',
      farmName: 'Keystone Herbal Garden',
      person: 'Arica Guthrie',
      lines: [
        { at: at('2026-11-25T21:47:49Z'), who: 'farmer', text: 'I have rosemary.' },
        { at: at('2026-11-25T21:47:57Z'), who: 'breadbasket', text: 'Rosemary. Sound right?' },
      ],
      published: ['rosemary: on the page, no amount'],
      notes: [],
    }
    const text = renderSessions([farm])
    expect(text).toContain('Keystone Herbal Garden — Arica Guthrie')
    expect(text).toContain('farmer: I have rosemary.')
    expect(text).toContain('breadbasket: Rosemary. Sound right?')
    expect(text).toContain('rosemary: on the page, no amount')
  })

  it('marks the founder farm so it is not briefed as an alpha farmer', () => {
    const text = renderSessions([
      {
        farmId: 'seed-farm',
        farmName: 'Mighty Thundercloud',
        person: 'Thelonius Cook',
        lines: [{ at: at('2026-11-24T01:31:16Z'), who: 'farmer', text: "I've got kale." }],
        published: [],
        notes: ['harvests to order'],
      },
    ])
    expect(text).toContain('founder test farm')
    expect(text).toContain('Ledger kept: nothing.')
    expect(text).toContain('harvests to order')
  })
})
