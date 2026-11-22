import { describe, expect, it } from 'vitest'
import { colophon, entries, howToRead, preface, reading, soil, tended, words } from './content'

describe('almanac', () => {
  it('has a tended date and a preface', () => {
    expect(tended.length).toBeGreaterThan(0)
    expect(preface.length).toBeGreaterThan(0)
    expect(colophon).toContain('lib/almanac/content.ts')
  })

  it('explains the three-part reading', () => {
    expect(howToRead.map((part) => part.k)).toEqual(['Soil', 'Requirement', 'Consequence'])
  })

  it('gives every card a unique id, a unique number, and a full mapping', () => {
    const ids = entries.map((entry) => entry.id)
    const numbers = entries.map((entry) => entry.number)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(numbers).size).toBe(numbers.length)

    for (const entry of entries) {
      expect(entry.index.trim().length).toBeGreaterThan(0)
      expect(entry.title.trim().length).toBeGreaterThan(0)
      expect(entry.lead.trim().length).toBeGreaterThan(0)
      expect(entry.soil.trim().length).toBeGreaterThan(0)
      expect(entry.requirement.trim().length).toBeGreaterThan(0)
      expect(entry.consequence.trim().length).toBeGreaterThan(0)
      expect(entry.source.trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps the three standings, including the past-date decision', () => {
    const standings = new Set(entries.map((entry) => entry.standing))
    expect(standings).toEqual(new Set(['decided', 'hypothesis', 'open']))
    expect(entries.find((entry) => entry.id === 'coming-soon-holds')?.standing).toBe('decided')
  })

  it('anchors soil, the phrase book, and the glossary without colliding with the cards', () => {
    const ids = new Set(entries.map((entry) => entry.id))
    for (const belief of soil) {
      expect(ids.has(belief.id)).toBe(false)
      expect(belief.title.trim().length).toBeGreaterThan(0)
      expect(belief.body.trim().length).toBeGreaterThan(0)
    }
    expect(ids.has(reading.id)).toBe(false)
    expect(reading.rows.length).toBeGreaterThan(0)
    for (const row of reading.rows) {
      expect(row.when.trim().length).toBeGreaterThan(0)
      expect(row.say.trim().length).toBeGreaterThan(0)
    }

    const terms: string[] = []
    for (const group of words) {
      expect(ids.has(group.id)).toBe(false)
      for (const word of group.terms) {
        terms.push(`${group.id}:${word.term}`)
        expect(word.means.trim().length).toBeGreaterThan(0)
      }
    }
    expect(new Set(terms).size).toBe(terms.length)
  })
})
