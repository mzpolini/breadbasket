import { describe, expect, it } from 'vitest'
import { activeRules, type HarvestRule } from './index'

const NOW = new Date('2026-08-27T12:00:00Z')
const opts = { now: NOW, freshnessDays: 7 }

function rule(over: Partial<HarvestRule> & Pick<HarvestRule, 'id'>): HarvestRule {
  return {
    farmId: 'farm',
    product: 'watermelon',
    rawPhrase: 'twenty pounds of watermelon every week through september',
    amount: { value: 20, unit: 'lb' },
    interval: 'weekly',
    endsOn: '2026-09-30',
    ended: false,
    createdAt: '2026-08-26T09:00:00Z',
    ...over,
  }
}

describe('activeRules', () => {
  it('shows a standing rule', () => {
    const [active] = activeRules([rule({ id: 'r1' })], opts)
    expect(active.product).toBe('watermelon')
    expect(active.flagged).toBe(false)
    expect(active.daysSinceSpoken).toBe(1)
  })

  it('drops a superseded rule and keeps the replacement', () => {
    const active = activeRules(
      [
        rule({ id: 'r1' }),
        rule({
          id: 'r2',
          amount: { value: 15, unit: 'lb' },
          supersedesId: 'r1',
          createdAt: '2026-08-27T09:00:00Z',
        }),
      ],
      opts,
    )
    expect(active).toHaveLength(1)
    expect(active[0].amount?.value).toBe(15)
  })

  it('an explicit end removes the rule', () => {
    const active = activeRules(
      [
        rule({ id: 'r1' }),
        rule({ id: 'r2', ended: true, supersedesId: 'r1', createdAt: '2026-08-27T09:00:00Z' }),
      ],
      opts,
    )
    expect(active).toHaveLength(0)
  })

  it('a rule past its end date is gone', () => {
    expect(activeRules([rule({ id: 'r1', endsOn: '2026-08-26' })], opts)).toHaveLength(0)
  })

  it('a rule ending today still stands', () => {
    expect(activeRules([rule({ id: 'r1', endsOn: '2026-08-27' })], opts)).toHaveLength(1)
  })

  it('flags a rule he has not spoken about in a week', () => {
    const [active] = activeRules([rule({ id: 'r1', createdAt: '2026-08-19T09:00:00Z' })], opts)
    expect(active.flagged).toBe(true)
    expect(active.daysSinceSpoken).toBe(8)
  })

  it('re-affirming is a newer rule with the same content, and resets the clock', () => {
    const active = activeRules(
      [
        rule({ id: 'r1', createdAt: '2026-08-10T09:00:00Z' }),
        rule({ id: 'r2', supersedesId: 'r1', createdAt: '2026-08-27T09:00:00Z' }),
      ],
      opts,
    )
    expect(active[0].flagged).toBe(false)
  })

  it('never lists one crop twice, even without a supersedes link', () => {
    const active = activeRules(
      [rule({ id: 'r1' }), rule({ id: 'r2', createdAt: '2026-08-27T09:00:00Z' })],
      opts,
    )
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('r2')
  })

  it('keeps an unstructured interval verbatim', () => {
    const [active] = activeRules([rule({ id: 'r1', interval: 'tuesdays and thursdays' })], opts)
    expect(active.interval).toBe('tuesdays and thursdays')
  })
})
