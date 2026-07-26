'use client'

import { useState } from 'react'
import type { InventoryRow } from '@/lib/projections'

/**
 * Surface 2, direction three (design `1f`) — one crop, one card, one thumb.
 *
 * Dark ground on purpose: this is the view used at dusk with a torch in the
 * other hand. Nothing is smaller than 13px or thinner than a thumb.
 *
 * Every button here is meant to write a movement rather than overwrite a
 * figure, so this view and the conversation can never disagree about what
 * happened. They advance the stack for now — the writes land with the agent.
 */
export function CropStack({ rows }: { rows: InventoryRow[] }) {
  const ordered = prioritise(rows)
  const [index, setIndex] = useState(0)
  const row = ordered[index]
  const next = ordered[index + 1]
  const remaining = ordered.length - index - 1

  const advance = () => setIndex((i) => Math.min(i + 1, ordered.length))

  if (!row) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span
          className="text-[26px]"
          style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-bg)' }}
        >
          That&rsquo;s everything.
        </span>
        <span className="text-[15px]" style={{ color: 'rgba(245,234,216,.6)' }}>
          Your page is up to date.
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-baseline gap-[10px] px-[22px] pb-[14px] pt-[6px]">
        <span className="meta text-[12px]" style={{ color: 'rgba(245,234,216,.6)' }}>
          {index + 1} of {ordered.length}
        </span>
        <span
          className="relative h-[3px] flex-1 overflow-hidden rounded-full"
          style={{ background: 'rgba(245,234,216,.2)' }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
            style={{
              width: `${((index + 1) / ordered.length) * 100}%`,
              background: 'var(--color-accent-400)',
            }}
          />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-[14px] px-[18px] pb-2">
        <div
          className="flex flex-1 flex-col rounded-[34px] px-[26px] py-[30px]"
          style={{ background: 'var(--color-bg)', boxShadow: '0 12px 32px rgba(0,0,0,.35)' }}
        >
          <span
            className="meta text-[13px] tracking-[.06em]"
            style={{ color: 'var(--color-accent-700)' }}
          >
            {kicker(row)}
          </span>

          <span
            className="mt-3 text-[40px] capitalize leading-[1.05]"
            style={{ fontFamily: 'var(--font-caprasimo)' }}
          >
            {row.product}
          </span>

          <div className="mt-[22px] flex items-baseline gap-[10px]">
            <span
              className="tnum text-[68px] leading-[.9]"
              style={{ fontFamily: 'var(--font-caprasimo)' }}
            >
              {headline(row)}
            </span>
            {row.quantity && row.attention !== 'unit-conflict' && (
              <span
                className="text-[22px] leading-none"
                style={{ color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}
              >
                {row.quantity.unit}
              </span>
            )}
          </div>

          <span
            className="mt-[14px] text-pretty text-[15px] leading-[1.5]"
            style={{ color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}
          >
            {explain(row)}
          </span>

          <div className="flex-1" />

          <div className="flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={advance}
              className="btn btn-primary btn-block"
              style={{ fontSize: 17, padding: '19px 18px' }}
            >
              {primaryAction(row)}
            </button>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={advance}
                className="btn btn-secondary flex-1"
                style={{ fontSize: 16, padding: '18px 14px' }}
              >
                Still about right
              </button>
              <button
                type="button"
                onClick={advance}
                className="btn btn-secondary flex-1"
                style={{ fontSize: 16, padding: '18px 14px' }}
              >
                Sold out
              </button>
            </div>
          </div>
        </div>

        {next && (
          <button
            type="button"
            onClick={advance}
            className="flex h-[74px] items-center gap-[14px] rounded-[26px] px-6 text-left"
            style={{ background: 'rgba(245,234,216,.1)' }}
          >
            <span
              className="text-[20px] capitalize leading-none"
              style={{ fontFamily: 'var(--font-caprasimo)', color: 'rgba(245,234,216,.9)' }}
            >
              {next.product}
            </span>
            {next.attention && (
              <span
                className="meta rounded-full px-[10px] py-[5px] text-[11px] font-semibold"
                style={{ background: 'var(--color-accent-700)', color: 'var(--color-accent-200)' }}
              >
                {chip(next)}
              </span>
            )}
            <span className="ml-auto text-[20px]" style={{ color: 'rgba(245,234,216,.45)' }}>
              ›
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-[22px] pb-5 pt-4">
        <button
          type="button"
          onClick={advance}
          className="btn btn-ghost"
          style={{ fontSize: 15, padding: '14px 16px', color: 'rgba(245,234,216,.75)' }}
        >
          Skip
        </button>
        <span className="meta text-[12px]" style={{ color: 'rgba(245,234,216,.5)' }}>
          {remaining > 0 ? `${remaining} left · then it's up` : "last one · then it's up"}
        </span>
      </div>
    </>
  )
}

/** What needs him comes first, settled crops last. The order is the job. */
function prioritise(rows: InventoryRow[]): InventoryRow[] {
  const rank = (row: InventoryRow) => {
    if (row.attention === 'unit-conflict' || row.attention === 'negative') return 0
    if (row.attention === 'needs-weighing') return 1
    if (!row.live) return 2
    return 3
  }
  return [...rows].sort((a, b) => rank(a) - rank(b))
}

function kicker(row: InventoryRow): string {
  if (row.attention === 'unit-conflict') return 'COUNTED TWO WAYS'
  if (row.attention === 'negative') return 'A PICK IS MISSING'
  if (row.attention === 'needs-weighing') return 'GUESSED FOR A WHILE'
  if (!row.live) return 'OFF YOUR PAGE'
  if (row.confidence === 'weighed') return 'WEIGHED'
  return 'ON YOUR PAGE'
}

function headline(row: InventoryRow): string {
  if (row.attention === 'unit-conflict') return 'two ways'
  if (!row.quantity) return 'some'
  if (row.quantity.value === 0) return 'none'
  return `${row.confidence === 'estimated' && row.quantity.value > 0 ? '~' : ''}${row.quantity.value}`
}

function explain(row: InventoryRow): string {
  switch (row.attention) {
    case 'unit-conflict':
      return "You've counted this two ways this week. I can't add one to the other, so buyers see nothing for it until you pick one."
    case 'negative':
      return "More went out than ever came in — that's a pick you never told me about, not bad arithmetic. Add it and this fixes itself."
    case 'needs-weighing':
      return typeof row.weeksSinceMeasured === 'number'
        ? `Your page has been saying "about" for ${row.weeksSinceMeasured} weeks. One trip to the scale and it says a number and means it.`
        : 'Your page has been guessing at this. One trip to the scale and it says a number and means it.'
    default:
      break
  }
  if (!row.live) {
    return "This dropped off your page. Tell me whether it's sold out or just went unmentioned."
  }
  if (!row.quantity) {
    return "You never gave me a number, and that's fine — buyers just see that you have some."
  }
  return 'Still showing on your page. Tell me if it changed.'
}

function primaryAction(row: InventoryRow): string {
  if (row.attention === 'unit-conflict') return 'Pick a unit'
  if (row.attention === 'negative') return 'Add the missing pick'
  return 'I weighed it'
}

function chip(row: InventoryRow): string {
  if (row.attention === 'unit-conflict') return 'two units'
  if (row.attention === 'negative') return 'below zero'
  return 'guessed'
}
