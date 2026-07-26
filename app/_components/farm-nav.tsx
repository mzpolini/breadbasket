'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { SEED_FARM } from '@/lib/seed'

/**
 * The farm's chrome. Sticky, dark, and present on every farmer surface.
 *
 * Dark on purpose: the chat sits on a light ground and the barn view on a dark
 * one, deliberately — one is read indoors, the other at dusk with a torch. A bar
 * that matched either would fight the other, so it reads as a title bar over the
 * first and merges into the second.
 *
 * Thumb-sized targets throughout. This is used one-handed.
 */
export function FarmNav({ secret }: { secret: string }) {
  const pathname = usePathname()
  const params = useSearchParams()

  const base = `/farm/${secret}`
  const onStock = pathname.endsWith('/stock')
  const verbose = params.get('v') === '1'

  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: 'var(--color-neutral-900)' }}
    >
      <div className="mx-auto flex max-w-[560px] items-center gap-1 px-3 py-2">
        <Link
          href={base}
          className="mr-auto truncate px-1 text-[15px]"
          style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-bg)' }}
        >
          {SEED_FARM.name}
        </Link>

        <Tab href={base} active={!onStock}>
          Talk
        </Tab>
        <Tab href={`${base}/stock`} active={onStock}>
          Your stock
        </Tab>
        <Tab href={`/f/${SEED_FARM.id}`} active={false} title="what buyers see">
          Your page
        </Tab>
      </div>

      {!onStock && (
        <div
          className="mx-auto flex max-w-[560px] justify-end px-3 pb-2"
          style={{ color: 'rgba(245,234,216,.55)' }}
        >
          <Link
            href={`${base}?v=${verbose ? '0' : '1'}`}
            className="meta px-2 py-1 text-[12px] underline"
          >
            {verbose ? 'hide the working' : 'show your working'}
          </Link>
        </div>
      )}
    </header>
  )
}

function Tab({
  href,
  active,
  title,
  children,
}: {
  href: string
  active: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      title={title}
      className="rounded-full px-3 py-2 text-[13px] whitespace-nowrap"
      style={{
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-bg)' : 'rgba(245,234,216,.7)',
      }}
    >
      {children}
    </Link>
  )
}
