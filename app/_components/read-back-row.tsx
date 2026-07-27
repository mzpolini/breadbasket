/**
 * Treatment 1b — the kind-first ledger line.
 *
 * The word that reads first is the **kind**, not the number, and that is the
 * whole point of the row. The agent has to infer whether "I've got 50 pounds"
 * means his total or fifty more; it assumes total, and when that assumption is
 * wrong it silently discards stock. The read-back is the only place that can be
 * caught, so `edit` offers flipping the kind before anything else.
 *
 * Presentational on purpose. The projection that feeds it arrives with the chat
 * surface — until then the shape below is the contract.
 */

export type ReadBackRow = {
  product: string
  /** Headline figure as it should read: "20 bunches", "available", "none left", "−10 lb". */
  figure: string
  /** Kind and confidence: "total · estimated", "90 lb total · estimated". */
  meta: string
  /** Shown as a chip beside the figure when a movement is not a plain total. */
  chip?: 'added' | 'sold' | 'spoiled'
  tone?: 'normal' | 'available' | 'spent' | 'owed' | 'forecast'
  /** Replaces figure and meta entirely — used when there is no honest number. */
  conflict?: { headline: string; explanation: string; options: string[] }
}

const FIGURE_TONE: Record<NonNullable<ReadBackRow['tone']>, string> = {
  normal: 'var(--color-text)',
  available: 'var(--color-accent-2-700)',
  spent: 'color-mix(in srgb, var(--color-text) 45%, transparent)',
  owed: 'var(--color-accent-700)',
  forecast: 'var(--color-accent-2-700)',
}

export function ReadBackList({
  rows,
  onEdit,
}: {
  rows: ReadBackRow[]
  /** Omit to render the row read-only — used where nothing is pending. */
  onEdit?: (index: number) => void
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-[28px]"
      style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-md)' }}
    >
      {rows.map((row, i) => (
        <Row
          key={`${row.product}-${i}`}
          row={row}
          last={i === rows.length - 1}
          onEdit={onEdit && (() => onEdit(i))}
        />
      ))}
    </div>
  )
}

function Row({
  row,
  last,
  onEdit,
}: {
  row: ReadBackRow
  last: boolean
  onEdit?: () => void
}) {
  const tone = row.tone ?? 'normal'
  const border = last ? undefined : '1px solid color-mix(in srgb, var(--color-text) 10%, transparent)'

  if (row.conflict) {
    return (
      <div
        className="flex flex-col gap-[9px] px-5 py-4"
        style={{ borderBottom: border, background: 'var(--color-accent-100)' }}
      >
        <div className="flex items-baseline gap-3">
          <span className="flex-1 text-[17px] font-semibold leading-[1.25]">{row.product}</span>
          <span
            className="meta text-[11px] font-semibold"
            style={{ color: 'var(--color-accent-700)' }}
          >
            {row.conflict.headline}
          </span>
        </div>
        <span
          className="text-[12.5px] leading-[1.45]"
          style={{ color: 'var(--color-accent-800)' }}
        >
          {row.conflict.explanation}
        </span>
        <div className="flex flex-wrap items-center gap-[9px]">
          {row.conflict.options.map((option, i) => (
            <span key={option} className="flex items-center gap-[9px]">
              {i > 0 && (
                <span
                  className="meta text-[12px]"
                  style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
                >
                  or
                </span>
              )}
              <button
                type="button"
                className="rounded-full bg-white px-[13px] py-[9px] text-[13.5px] leading-[1.3]"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                {option}
              </button>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-[5px] px-5 py-4"
      style={{
        borderBottom: border,
        // The forecast never enters the black-ink column where current stock lives.
        borderLeft: tone === 'forecast' ? '4px solid var(--color-accent-2-300)' : undefined,
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="flex-1 text-[17px] font-semibold leading-[1.25]">{row.product}</span>
        <span
          className="tnum text-[17px] leading-[1.25]"
          style={{ color: FIGURE_TONE[tone] }}
        >
          {row.figure}
        </span>
        {row.chip && (
          <span
            className="meta rounded-full px-[9px] py-[4px] text-[11px] font-semibold"
            style={{ background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-800)' }}
          >
            {row.chip}
          </span>
        )}
      </div>
      <div className="flex items-center gap-[10px]">
        <span
          className="meta flex-1 text-[12.5px] leading-[1.4]"
          style={{
            color: tone === 'owed'
              ? 'var(--color-accent-700)'
              : 'color-mix(in srgb, var(--color-text) 62%, transparent)',
          }}
        >
          {row.meta}
        </span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-ghost text-[12.5px]"
            style={{ padding: '8px 14px' }}
          >
            edit
          </button>
        )}
      </div>
    </div>
  )
}
