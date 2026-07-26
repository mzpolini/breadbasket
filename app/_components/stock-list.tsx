import { formatAmount } from '@/lib/ledger'
import type { InventoryRow } from '@/lib/projections'

/**
 * Everything he has, on one screen.
 *
 * The walkthrough (`1f`) is good at getting a week confirmed and bad at the
 * question "what have I actually got?" — it shows one crop at a time and never
 * the whole book. This is the other half: the comprehensive view, in the
 * read-back card's language so his stock and his read-backs look like the same
 * object.
 *
 * Grouped by what needs him rather than alphabetically, and the groups are named
 * in his terms — "needs you", "on your page", "dropped off". A lapsed crop stays
 * visible here even though the buyer page has already dropped it, because the
 * whole point of this screen is that nothing is hidden from him.
 */
export function StockList({ rows, now }: { rows: InventoryRow[]; now: Date }) {
  const forecasts = rows.filter((row) => row.window)
  const current = rows.filter((row) => !row.window)

  const needsYou = current.filter((row) => row.attention)
  const live = current.filter((row) => !row.attention && row.live)
  const lapsed = current.filter((row) => !row.attention && !row.live)

  return (
    <div className="flex flex-col gap-[22px] px-[18px] pb-8 pt-[18px]">
      <Summary total={current.length} live={live.length} needsYou={needsYou.length} />

      {needsYou.length > 0 && (
        <Group label="NEEDS YOU" rows={needsYou} now={now} />
      )}
      {live.length > 0 && <Group label="ON YOUR PAGE" rows={live} now={now} />}
      {lapsed.length > 0 && (
        <Group
          label="DROPPED OFF YOUR PAGE"
          note="Expired on their own. Say a word about any of these and they come back."
          rows={lapsed}
          now={now}
        />
      )}
      {forecasts.length > 0 && (
        <Group
          label="EXPECTED LATER"
          note="Forecasts, not stock. These never count toward what buyers can have now."
          rows={forecasts}
          now={now}
        />
      )}
    </div>
  )
}

function Summary({
  total,
  live,
  needsYou,
}: {
  total: number
  live: number
  needsYou: number
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[22px] leading-[1.15]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
        {total} {total === 1 ? 'crop' : 'crops'} in your book
      </span>
      <span
        className="meta text-[12px] leading-[1.5]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}
      >
        {live} showing to buyers
        {needsYou > 0 && ` · ${needsYou} need${needsYou === 1 ? 's' : ''} you`}
      </span>
    </div>
  )
}

function Group({
  label,
  note,
  rows,
  now,
}: {
  label: string
  note?: string
  rows: InventoryRow[]
  now: Date
}) {
  return (
    <div className="flex flex-col gap-[9px]">
      <span
        className="meta text-[10.5px] font-semibold tracking-[0.08em]"
        style={{ color: 'var(--color-accent-2-700)' }}
      >
        {label}
      </span>
      {note && (
        <span
          className="text-[12.5px] leading-[1.5]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}
        >
          {note}
        </span>
      )}
      <div
        className="overflow-hidden rounded-[20px]"
        style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)' }}
      >
        {rows.map((row, index) => (
          <Row key={row.product} row={row} now={now} first={index === 0} />
        ))}
      </div>
    </div>
  )
}

function Row({ row, now, first }: { row: InventoryRow; now: Date; first: boolean }) {
  return (
    <div
      className="flex flex-col gap-[4px] px-[16px] py-[13px]"
      style={{
        borderTop: first ? undefined : '1px solid var(--color-divider)',
        // A forecast never sits in the same ink as stock on hand.
        borderLeft: row.window ? '4px solid var(--color-accent-2-300)' : undefined,
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="flex-1 text-[16px] font-semibold capitalize leading-[1.25]">
          {row.product}
        </span>
        <span
          className="tnum text-[16px] leading-[1.25]"
          style={{ color: figureColour(row) }}
        >
          {figure(row)}
        </span>
      </div>
      <span
        className="meta text-[11.5px] leading-[1.45]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}
      >
        {detail(row, now)}
      </span>
    </div>
  )
}

function figure(row: InventoryRow): string {
  if (row.attention === 'unit-conflict') return 'counted 2 ways'
  if (row.quantity === null) return 'some'
  if (row.quantity.value === 0) return 'none left'
  const tilde = row.confidence === 'estimated' ? '~' : ''
  return `${tilde}${formatAmount(row.quantity)}`
}

function figureColour(row: InventoryRow): string {
  if (row.attention === 'unit-conflict' || row.attention === 'negative') {
    return 'var(--color-accent-700)'
  }
  if (row.window) return 'var(--color-accent-2-700)'
  if (row.quantity?.value === 0) return 'color-mix(in srgb, var(--color-text) 45%, transparent)'
  return 'var(--color-text)'
}

/**
 * One line, and it must answer "can I trust this number?" — where it came from,
 * and how long it has left before it stops showing.
 */
function detail(row: InventoryRow, now: Date): string {
  switch (row.attention) {
    case 'unit-conflict':
      return "two units at once — buyers see nothing until you pick one"
    case 'negative':
      return 'below zero — a pick never got recorded'
    case 'needs-weighing':
      return row.weeksSinceMeasured === null
        ? 'guessed every time so far — worth weighing'
        : `not weighed in ${row.weeksSinceMeasured} week${row.weeksSinceMeasured === 1 ? '' : 's'}`
    default:
      break
  }

  if (row.window) return `${row.window.from} – ${row.window.to}`

  const source = row.quantity === null ? 'no number given' : row.confidence
  if (!row.live) return `${source} · expired${row.expiresAt ? ` ${when(row.expiresAt, now)}` : ''}`
  return `${source}${row.expiresAt ? ` · shows until ${when(row.expiresAt, now)}` : ''}`
}

function when(iso: string, now: Date): string {
  const days = Math.round((Date.parse(iso) - now.getTime()) / (24 * 60 * 60 * 1000))
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days < 0) return `${Math.abs(days)} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' })
}
