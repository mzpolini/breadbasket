'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { SEED_FARM } from '@/lib/seed'

/**
 * The farm's header, in the language of design `1a`.
 *
 * It lives in the layout and is `flex-none` inside the phone frame rather than
 * `sticky` — the frame owns the scroll, so the header is simply always there. It
 * does not remount on navigation, which is the whole point.
 *
 * Two rows, not three: the design's identity row (farm, then the week's context —
 * "Sat 26 Jul · market in 2 days", because everything he does is in service of
 * Saturday), then the tabs. There is no separate "which screen am I on" line
 * because the lit tab already says so, and a phone header can't afford a row
 * that repeats itself.
 *
 * The tab row is not in the design — the design is one prototype screen. It is
 * written in Organic's vocabulary rather than invented: accent pill for the
 * current surface, muted for the rest, thumb-sized because this is one-handed.
 */
export function FarmNav({ secret }: { secret: string }) {
  const pathname = usePathname()
  const params = useSearchParams()

  const base = `/farm/${secret}`
  const onStock = pathname.endsWith('/stock')
  const onPreview = pathname.endsWith('/preview')
  const onTalk = !onStock && !onPreview
  const verbose = params.get('v') === '1'

  return (
    <header
      className="flex-none"
      style={{
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <div className="flex items-center gap-[11px] px-[18px] pb-[11px] pt-[14px]">
        <span
          aria-hidden
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[16px]"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-caprasimo)',
          }}
        >
          {SEED_FARM.name.charAt(0)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="truncate text-[16px] leading-[1.15]"
            style={{ fontFamily: 'var(--font-caprasimo)' }}
          >
            {SEED_FARM.name}
          </span>
          <span
            className="meta truncate text-[11px] leading-[1.35]"
            style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
          >
            {weekContext()}
          </span>
        </div>

        {onTalk && (
          <Link
            href={`${base}?v=${verbose ? '0' : '1'}`}
            className="meta flex-none rounded-full px-[10px] py-[7px] text-[10.5px] leading-none"
            style={{
              background: verbose ? 'var(--color-accent-2-200)' : 'transparent',
              border: '1px solid var(--color-divider)',
              color: verbose
                ? 'var(--color-accent-2-800)'
                : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            working
          </Link>
        )}
      </div>

      <nav className="flex gap-[6px] px-[18px] pb-[11px]">
        <Tab href={base} active={onTalk}>
          Talk
        </Tab>
        <Tab href={`${base}/stock`} active={onStock}>
          Your stock
        </Tab>
        {/* His own page, previewed in-shell — not the bare buyer URL, which has
            no nav and would strand him. */}
        <Tab href={`${base}/preview`} active={onPreview}>
          Your page
        </Tab>
      </nav>
    </header>
  )
}

function Tab({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-full px-[13px] py-[8px] text-[13px] leading-none"
      style={{
        background: active ? 'var(--color-accent)' : 'var(--color-surface)',
        color: active ? 'var(--color-bg)' : 'color-mix(in srgb, var(--color-text) 68%, transparent)',
        fontFamily: 'var(--font-caprasimo)',
      }}
    >
      {children}
    </Link>
  )
}

/**
 * Everything he does is in service of Saturday, so the header says how far away
 * it is rather than just printing today's date.
 */
function weekContext(): string {
  const now = new Date()
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const daysToSaturday = (6 - now.getDay() + 7) % 7
  const market =
    daysToSaturday === 0
      ? 'market today'
      : daysToSaturday === 1
        ? 'market tomorrow'
        : `market in ${daysToSaturday} days`

  return `${date} · ${market}`
}
