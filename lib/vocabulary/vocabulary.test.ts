import { describe, expect, it } from 'vitest'
import { emptyVocabulary, learn, resolve } from './index'

describe('resolve', () => {
  it('resolves a learned term to the product it was taught', () => {
    // He said "greens", corrected the read-back to collard greens. Next week
    // "greens" should mean what he said it means.
    const vocabulary = learn(emptyVocabulary('farm-1'), 'greens', 'collard greens')

    expect(resolve(vocabulary, 'greens')).toEqual({
      product: 'collard greens',
      known: true,
    })
  })

  it('matches regardless of case and surrounding whitespace', () => {
    // Speech-to-text and typing both produce ragged input; the farm's language
    // is about words, not keystrokes.
    const vocabulary = learn(emptyVocabulary('farm-1'), 'Greens', 'collard greens')

    expect(resolve(vocabulary, '  greens ').product).toBe('collard greens')
  })

  it('returns an unknown term as its own product', () => {
    // "Purple hull peas" has never been heard. That is not an error — it is a
    // new product, named as he said it, and the read-back can flag it as new.
    const resolution = resolve(emptyVocabulary('farm-1'), 'purple hull peas')

    expect(resolution).toEqual({ product: 'purple hull peas', known: false })
  })
})

describe('learn', () => {
  it('leaves the vocabulary it was given untouched', () => {
    const before = learn(emptyVocabulary('farm-1'), 'greens', 'collard greens')
    const after = learn(before, 'peas', 'purple hull peas')

    expect(resolve(before, 'peas').known).toBe(false)
    expect(resolve(after, 'peas').known).toBe(true)
  })

  it('lets a later correction override an earlier mapping', () => {
    // He taught "greens" as collards, then corrected it to mustard. The most
    // recent correction is the one he meant — last write wins.
    const vocabulary = learn(
      learn(emptyVocabulary('farm-1'), 'greens', 'collard greens'),
      'greens',
      'mustard greens',
    )

    expect(resolve(vocabulary, 'greens').product).toBe('mustard greens')
  })
})
