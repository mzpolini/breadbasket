import type { FarmRow } from '@/lib/db/schema'

/** What the header needs of a farm — a row satisfies it. */
export type FarmIdentity = Pick<FarmRow, 'name' | 'tagline' | 'market' | 'logo'>

/**
 * Farm identity block. Falls back to the initial in a disc when no logo file is
 * present — a missing brand asset should not leave a broken image on a page
 * whose whole job is looking trustworthy.
 */
export function FarmHeader({
  farm,
  hasLogo = false,
}: {
  farm: FarmIdentity
  hasLogo?: boolean
}) {
  return (
    <div className="flex flex-col gap-[14px]">
      {hasLogo && farm.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={farm.logo}
          alt={[farm.name, farm.tagline].filter(Boolean).join(' ')}
          className="h-[74px] w-[74px] rounded-full bg-white object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-[30px]"
          style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-accent-700)' }}
        >
          {farm.name.charAt(0)}
        </div>
      )}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[27px] leading-[1.1]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
          {farm.name}
        </span>
        <span
          className="meta text-[13px] leading-[1.4]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}
        >
          {farm.tagline}
          {farm.tagline && farm.market && <br />}
          {farm.market}
        </span>
      </div>
    </div>
  )
}
