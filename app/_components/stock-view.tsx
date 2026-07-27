'use client'

import { useState } from 'react'
import type { InventoryRow } from '@/lib/projections'
import { CropStack } from './crop-stack'
import { StockList } from './stock-list'

/**
 * Two ways to look at the same stock, because they answer different questions.
 *
 * **All of it** is the default. "What have I actually got?" is the question he
 * arrives with, and a walkthrough cannot answer it — it shows one crop at a time
 * and never the whole book, which is exactly the thing his paper notebook does
 * well. The comprehensive view has to be the one he lands on or the notebook
 * wins.
 *
 * **Walk through** is `1f`, kept intact: the once-a-week pass that gets the
 * whole list confirmed before market. It is a task, not a view, so it is one tap
 * away rather than in the way.
 *
 * The two grounds differ on purpose — the light list belongs with the rest of the
 * app, the dark walkthrough is for dusk with a torch — so the switch changes the
 * background with the mode.
 */
export function StockView({
  rows,
  now,
  secret,
}: {
  rows: InventoryRow[]
  now: Date
  secret: string
}) {
  const [walking, setWalking] = useState(false)

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={{ background: walking ? 'var(--color-neutral-900)' : 'var(--color-bg)' }}
    >
      <div className="flex flex-none gap-[6px] px-[18px] pt-[14px]">
        <Mode active={!walking} dark={walking} onClick={() => setWalking(false)}>
          All of it
        </Mode>
        <Mode active={walking} dark={walking} onClick={() => setWalking(true)}>
          Walk through
        </Mode>
      </div>

      {walking ? (
        <div className="flex min-h-0 flex-1 flex-col pt-[10px]">
          <CropStack rows={rows} />
        </div>
      ) : (
        // StockList owns its own scroller and footer — the "Tell it what changed"
        // button has to sit below the scroll, not inside it.
        <StockList rows={rows} now={now} secret={secret} />
      )}
    </div>
  )
}

function Mode({
  active,
  dark,
  onClick,
  children,
}: {
  active: boolean
  dark: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-[13px] py-[8px] text-[12.5px] leading-none"
      style={{
        fontFamily: 'var(--font-caprasimo)',
        background: active
          ? 'var(--color-accent)'
          : dark
            ? 'rgba(245,234,216,.12)'
            : 'var(--color-surface)',
        color: active
          ? 'var(--color-bg)'
          : dark
            ? 'rgba(245,234,216,.7)'
            : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
      }}
    >
      {children}
    </button>
  )
}
