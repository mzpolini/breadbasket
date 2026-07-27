import { SEED_FARM } from '@/lib/seed'

/**
 * Farm identity block. Falls back to the initial in a disc when no logo file is
 * present — a missing brand asset should not leave a broken image on a page
 * whose whole job is looking trustworthy.
 */
export function FarmHeader({ hasLogo = false }: { hasLogo?: boolean }) {
  return (
    <div className="flex flex-col gap-[14px]">
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SEED_FARM.logo}
          alt={`${SEED_FARM.name} ${SEED_FARM.tagline}`}
          className="h-[74px] w-[74px] rounded-full bg-white object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-[30px]"
          style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-accent-700)' }}
        >
          {SEED_FARM.name.charAt(0)}
        </div>
      )}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[27px] leading-[1.1]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
          {SEED_FARM.name}
        </span>
        <span
          className="meta text-[13px] leading-[1.4]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}
        >
          {SEED_FARM.tagline}
          <br />
          {SEED_FARM.market}
        </span>
      </div>
    </div>
  )
}
