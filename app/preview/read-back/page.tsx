import { ReadBackList, type ReadBackRow } from '@/app/_components/read-back-row'

/**
 * Design `1b` in isolation, every state at once.
 *
 * A preview rather than a live surface: the read-back belongs to the chat, which
 * does not exist yet. It is here so the component is real and reviewable now,
 * and so the awkward rows — the ones no library ships — cannot be quietly
 * forgotten when the chat arrives.
 */
const ROWS: ReadBackRow[] = [
  {
    product: 'Collard greens',
    figure: '20 bunches',
    meta: 'total · estimated',
  },
  {
    product: 'Tomatoes',
    figure: '40 lb',
    chip: 'added',
    meta: '90 lb total · estimated',
  },
  {
    product: 'Okra',
    figure: 'available',
    tone: 'available',
    meta: "total · no amount, and that's fine",
  },
  {
    product: 'Summer squash',
    figure: 'none left',
    tone: 'spent',
    meta: 'sold out · weighed out Thursday',
  },
  {
    product: 'Sweet corn',
    figure: '',
    meta: '',
    conflict: {
      headline: 'no total',
      explanation:
        "Counted two ways. Boxes don't convert to dozens, so there's nothing honest to print.",
      options: ['4 boxes · today', '5 dozen · Tue'],
    },
  },
  {
    product: 'Peaches',
    figure: '−10 lb',
    tone: 'owed',
    meta: 'total · a pick is missing, not a mistake',
  },
  {
    product: 'Lima beans',
    figure: '~30 lb',
    tone: 'forecast',
    meta: 'not yet · ready Aug 1–8',
  },
]

export default function ReadBackPreview() {
  return (
    <main className="mx-auto w-full max-w-[460px] px-4 py-12">
      <h1 className="text-[26px]">Sound right?</h1>
      <p
        className="mb-6 mt-2 text-[14px] leading-[1.6]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}
      >
        Every state the read-back has to handle. The kind &mdash; <em>total</em>, <em>added</em>,{' '}
        <em>sold out</em> &mdash; reads before the confidence, because it is the inference that
        fails silently: read an addition as a total and stock is discarded with nothing to show
        for it.
      </p>

      <ReadBackList rows={ROWS} />

      <div className="mt-6 flex gap-3">
        <button type="button" className="btn btn-primary">
          Put it up
        </button>
        <button type="button" className="btn btn-secondary">
          Fix something
        </button>
      </div>
    </main>
  )
}
