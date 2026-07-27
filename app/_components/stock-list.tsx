'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { confirmStillTrue, markSoldOut } from '@/app/farm/[secret]/actions'
import { formatAmount } from '@/lib/ledger'
import { groupInventory, type InventoryRow } from '@/lib/projections'

/**
 * Surface 2, direction one — design `1d`, "What you've got".
 *
 * The comprehensive view: everything he has, sorted by what needs doing. The
 * designer's note was *"1f for the barn, 1d for honesty"* — the walkthrough is
 * better at getting a week confirmed, this is the only one that answers "what
 * have I actually got?", which is the thing the paper notebook does well.
 *
 * **Read-only except one verb.** "Still true" writes a confirmation movement and
 * "Sold out" writes a zero; neither edits a figure. So there is exactly one way
 * stock changes — something he said — and nothing here can ever disagree with
 * the conversation.
 *
 * Each group gets its own treatment because they mean different things: the
 * expiring group is the only one with buttons, conflicts sit on warm ground
 * because buyers are seeing nothing for them, lapsed is a dashed outline with no
 * fill because it is already off his page, and forecasts get a sage rule rather
 * than a card so they never read as stock.
 */
export function StockList({
  rows,
  now,
  secret,
}: {
  rows: InventoryRow[]
  now: Date
  secret: string
}) {
  const { expiringSoon, live, cantTotal, lapsed, forecast } = groupInventory(rows, { now })
  const [pending, startTransition] = useTransition()

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-4 pb-5 pt-1">
        {expiringSoon.map((row) => (
          <Section key={row.product} label="GONE FROM YOUR PAGE TOMORROW" tone="warn">
            <div
              className="flex flex-col gap-[11px] rounded-[20px] px-[17px] py-[15px]"
              style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)' }}
            >
              <Headline row={row} />
              <Meta>{provenance(row)}</Meta>
              <div className="flex gap-[9px]">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => {
                    void confirmStillTrue(row.product)
                  })}
                  className="btn btn-primary flex-1"
                  style={{ fontSize: 15, padding: '14px 16px' }}
                >
                  Still true
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => {
                    void markSoldOut(row.product)
                  })}
                  className="btn btn-secondary"
                  style={{ fontSize: 15, padding: '14px 16px' }}
                >
                  Sold out
                </button>
              </div>
            </div>
          </Section>
        ))}

        {live.length > 0 && (
          <Section label="LIVE">
            <div
              className="overflow-hidden rounded-[20px]"
              style={{ background: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)' }}
            >
              {live.map((row, index) => (
                <div
                  key={row.product}
                  className="flex flex-col gap-[4px] px-[17px] py-[14px]"
                  style={{
                    borderTop: index === 0 ? undefined : '1px solid var(--color-divider)',
                  }}
                >
                  <Headline row={row} />
                  <Meta tone={row.confidence === 'weighed' ? 'good' : 'quiet'}>
                    {provenance(row)}
                  </Meta>
                </div>
              ))}
            </div>
          </Section>
        )}

        {cantTotal.length > 0 && (
          <Section label="I CAN'T TOTAL THESE" tone="warn">
            {cantTotal.map((row) =>
              row.attention === 'unit-conflict' ? (
                <div
                  key={row.product}
                  className="flex flex-col gap-[9px] rounded-[20px] px-[17px] py-[15px]"
                  style={{ background: 'var(--color-accent-100)' }}
                >
                  <div className="flex items-baseline gap-[10px]">
                    <Crop>{row.product}</Crop>
                    <span
                      className="meta text-[11px] font-semibold"
                      style={{ color: 'var(--color-accent-700)' }}
                    >
                      counted two ways
                    </span>
                  </div>
                  <span
                    className="text-[12.5px] leading-[1.45]"
                    style={{ color: 'var(--color-accent-800)' }}
                  >
                    Buyers see nothing for {row.product} until you pick a unit.
                  </span>
                  <Link
                    href={`/farm/${secret}`}
                    className="btn btn-secondary self-start"
                    style={{ fontSize: 15, padding: '14px 16px' }}
                  >
                    Sort it out
                  </Link>
                </div>
              ) : (
                <div
                  key={row.product}
                  className="flex flex-col gap-[6px] rounded-[20px] px-[17px] py-[15px]"
                  style={{
                    background: 'var(--color-neutral-100)',
                    border: '1.5px solid var(--color-accent-400)',
                  }}
                >
                  <div className="flex items-baseline gap-[10px]">
                    <Crop>{row.product}</Crop>
                    <span
                      className="tnum text-[16.5px] leading-[1.2]"
                      style={{ color: 'var(--color-accent-700)' }}
                    >
                      {row.quantity ? formatAmount(row.quantity) : ''}
                    </span>
                  </div>
                  <span
                    className="text-[12.5px] leading-[1.45]"
                    style={{ color: 'var(--color-accent-800)' }}
                  >
                    More went out than ever came in. Tell me about the pick I missed.
                  </span>
                </div>
              ),
            )}
          </Section>
        )}

        {lapsed.length > 0 && (
          <Section label="LAPSED — BUYERS DON'T SEE THESE">
            {lapsed.map((row) => (
              <div
                key={row.product}
                className="flex flex-col gap-[5px] rounded-[20px] px-[17px] py-[14px]"
                style={{ border: '1.5px dashed color-mix(in srgb, var(--color-text) 28%, transparent)' }}
              >
                <div className="flex items-baseline gap-[10px]">
                  <span
                    className="flex-1 text-[16.5px] font-semibold capitalize leading-[1.2]"
                    style={{ color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}
                  >
                    {row.product}
                  </span>
                  <span
                    className="meta tnum text-[14px] leading-[1.2]"
                    style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
                  >
                    {row.quantity ? `was ${tilde(row)}${formatAmount(row.quantity)}` : 'was listed'}
                  </span>
                </div>
                <span
                  className="text-[12.5px] leading-[1.45]"
                  style={{ color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}
                >
                  Off the page since {dayOf(row.expiresAt, now)}. Sold out, or just not
                  mentioned?
                </span>
              </div>
            ))}
          </Section>
        )}

        {forecast.length > 0 && (
          <Section label="NEXT WEEK" tone="sage">
            {forecast.map((row) => (
              <div
                key={row.product}
                className="flex flex-col gap-[3px] py-[6px] pl-[14px]"
                style={{ borderLeft: '4px solid var(--color-accent-2-300)' }}
              >
                <div className="flex items-baseline gap-[10px]">
                  <span
                    className="flex-1 text-[16.5px] font-semibold capitalize leading-[1.2]"
                    style={{ color: 'var(--color-accent-2-700)' }}
                  >
                    {row.product}
                  </span>
                  <span
                    className="tnum text-[16.5px] leading-[1.2]"
                    style={{ color: 'var(--color-accent-2-700)' }}
                  >
                    {row.quantity ? `${tilde(row)}${formatAmount(row.quantity)}` : 'expected'}
                  </span>
                </div>
                <span
                  className="meta text-[12.5px] leading-[1.4]"
                  style={{ color: 'var(--color-accent-2-700)' }}
                >
                  {row.window && `${short(row.window.from)}–${short(row.window.to)} · `}
                  shown as coming, never as stock
                </span>
              </div>
            ))}
          </Section>
        )}
      </div>

      {/* The way out is always the conversation. There is nothing to edit here. */}
      <div
        className="flex-none px-4 pb-[18px] pt-[13px]"
        style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-divider)',
        }}
      >
        <Link
          href={`/farm/${secret}`}
          className="btn btn-primary btn-block"
          style={{ fontSize: 15.5, padding: '15px 18px' }}
        >
          Talk about what changed
        </Link>
      </div>
    </>
  )
}

function Section({
  label,
  tone = 'quiet',
  children,
}: {
  label: string
  tone?: 'quiet' | 'warn' | 'sage'
  children: React.ReactNode
}) {
  const colour =
    tone === 'warn'
      ? 'var(--color-accent-700)'
      : tone === 'sage'
        ? 'var(--color-accent-2-700)'
        : 'color-mix(in srgb, var(--color-text) 50%, transparent)'

  return (
    <div className="flex flex-col gap-[9px]">
      <span
        className="meta px-1 text-[11px] font-semibold tracking-[0.08em]"
        style={{ color: colour }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function Headline({ row }: { row: InventoryRow }) {
  return (
    <div className="flex items-baseline gap-[10px]">
      <Crop>{row.product}</Crop>
      <span
        className="tnum text-[16.5px] leading-[1.2]"
        style={{
          color:
            row.quantity === null
              ? 'var(--color-accent-2-700)'
              : row.quantity.value === 0
                ? 'color-mix(in srgb, var(--color-text) 45%, transparent)'
                : 'var(--color-text)',
        }}
      >
        {figure(row)}
      </span>
    </div>
  )
}

function Crop({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex-1 text-[16.5px] font-semibold capitalize leading-[1.2]">{children}</span>
  )
}

function Meta({
  tone = 'quiet',
  children,
}: {
  tone?: 'quiet' | 'good'
  children: React.ReactNode
}) {
  return (
    <span
      className="meta text-[12.5px] leading-[1.4]"
      style={{
        color:
          tone === 'good'
            ? 'var(--color-accent-2-800)'
            : 'color-mix(in srgb, var(--color-text) 62%, transparent)',
      }}
    >
      {children}
    </span>
  )
}

function figure(row: InventoryRow): string {
  if (row.quantity === null) return 'available'
  if (row.quantity.value === 0) return 'none left'
  return `${tilde(row)}${formatAmount(row.quantity)}`
}

/** A guess is marked as one. The tilde is the whole confidence signal. */
function tilde(row: InventoryRow): string {
  return row.confidence === 'estimated' && row.quantity !== null && row.quantity.value !== 0
    ? '~'
    : ''
}

/**
 * Where the number came from and how long it has left — the line that answers
 * "can I trust this?" without him having to ask.
 */
function provenance(row: InventoryRow): string {
  if (row.quantity === null) return 'no amount · fine as it is'

  const source = row.confidence === 'weighed' ? 'weighed' : 'estimated'
  if (row.attention === 'needs-weighing' && row.weeksSinceMeasured !== null) {
    return `${source} · not weighed in ${row.weeksSinceMeasured} week${
      row.weeksSinceMeasured === 1 ? '' : 's'
    }`
  }
  return row.expiresAt ? `${source} · ${timeLeft(row.expiresAt)}` : source
}

function timeLeft(expiresAt: string): string {
  const days = Math.round((Date.parse(expiresAt) - Date.now()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'gone today'
  if (days === 1) return 'gone tomorrow'
  return `${days} days left`
}

function dayOf(iso: string | null, now: Date): string {
  if (!iso) return 'a while back'
  const days = Math.round((now.getTime() - Date.parse(iso)) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' })
  return short(iso)
}

function short(iso: string): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
