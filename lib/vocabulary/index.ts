/**
 * A farm's private language.
 *
 * There is no canonical produce taxonomy and no setup step. The agent normalises
 * optimistically, shows its interpretation in the read-back it was going to show
 * anyway, and a correction teaches the mapping. Vocabulary therefore accretes
 * through ordinary use — which is why "onboarding" does not exist as a screen.
 *
 * Scoped per farm because one farmer's "greens" is another's mustard.
 */
export type Vocabulary = {
  farmId: string
  /** Normalised term -> the product it means. */
  terms: Record<string, string>
}

export type Resolution = {
  /** What to record. For an unknown term, the term itself. */
  product: string
  /** False when this term has never been taught — the read-back can say so. */
  known: boolean
}

export function emptyVocabulary(farmId: string): Vocabulary {
  return { farmId, terms: {} }
}

export function learn(vocabulary: Vocabulary, term: string, product: string): Vocabulary {
  return {
    ...vocabulary,
    terms: { ...vocabulary.terms, [key(term)]: product },
  }
}

export function resolve(vocabulary: Vocabulary, term: string): Resolution {
  const product = vocabulary.terms[key(term)]

  return product === undefined
    ? { product: term.trim(), known: false }
    : { product, known: true }
}

/**
 * Speech-to-text and thumbs on a phone both produce ragged input. A farm's
 * language is about words, not keystrokes.
 */
function key(term: string): string {
  return term.trim().toLowerCase()
}
