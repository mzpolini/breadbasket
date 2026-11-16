import Link from 'next/link'
import { Sprout } from '@/app/(public)/_components/brand'

/**
 * The page around sign-in, sign-up and "waiting for a farm" — the first
 * screens a pilot farmer sees after the marketing site, so they carry the
 * wordmark and a way back rather than a bare box in the middle of nowhere.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-dvh flex-1 flex-col items-center gap-8 px-4 py-10"
      style={{ background: 'var(--color-bg)' }}
    >
      <Link
        href="/"
        aria-label="Breadbasket home"
        className="flex items-center gap-2 text-[26px] leading-none"
        style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-text)' }}
      >
        <span className="inline-block h-[34px] w-[30px]" style={{ color: 'var(--color-accent-2-700)' }}>
          <Sprout />
        </span>
        Breadbasket
      </Link>
      <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
      <Link
        href="/"
        className="meta text-[12px]"
        style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
      >
        ← Back to breadbasket
      </Link>
    </main>
  )
}
