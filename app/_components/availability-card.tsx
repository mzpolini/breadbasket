import { FarmHeader } from '@/app/_components/farm-header'
import { activeRules, type ActiveRule } from '@/lib/cadence'
import { balancesFrom } from '@/lib/ledger'
import {
  forecastListings,
  lastSpokenAt,
  standListings,
  type ForecastListing,
  type StandListing,
} from '@/lib/projections'
import { FRESHNESS_DAYS } from '@/lib/seed'
import { rulesForFarm } from '@/lib/storage/harvest-rules'
import { movementsForFarm } from '@/lib/storage/movements'

/**
 * Surface 3 — the farm stand.
 *
 * Availability only. No weights, no counts, no "estimated" — those are for the
 * farmer, and later for wholesale. A customer sees four things and nothing
 * else: **Available**, **Available — not confirmed recently** (flagged, greyed,
 * with its age, still on the page), **Coming soon** (a harvest rule, in the
 * farmer's own sentence), and an **In season** badge on everything listed.
 *
 * Stale items stay visible on purpose. A page that quietly empties tells a
 * customer nothing and tells the farmer nothing; a page that visibly ages is
 * honest to one and a nudge to the other.
 *
 * A component rather than a page body because two routes render it — `/f/<farm>`
 * for buyers and the farmer's own preview — and they must never drift.
 */
export async function AvailabilityCard({ farmId = 'seed-farm' }: { farmId?: string } = {}) {
  const now = new Date()
  const [movements, rules] = await Promise.all([movementsForFarm(farmId), rulesForFarm(farmId)])
  const balances = balancesFrom(movements, { now, freshnessDays: FRESHNESS_DAYS })

  const listings = standListings(balances, { now })
  const comingSoon = activeRules(rules, { now, freshnessDays: FRESHNESS_DAYS })
  const oneOffs = forecastListings(balances)
  const spoken = lastSpokenAt(balances)

  return (
    <div
      className="flex flex-col gap-[26px] rounded-[34px] px-[26px] pb-[34px] pt-[30px]"
      style={{ background: 'var(--color-bg)', boxShadow: 'var(--shadow-md)' }}
    >
      <FarmHeader />

      {spoken && (
        <span
          className="meta text-[12.5px] leading-[1.5]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}
        >
          last updated {relativeDays(spoken, now)}
        </span>
      )}

      {listings.length === 0 ? (
        <EmptyWeek />
      ) : (
        <div className="flex flex-col gap-5">
          <Kicker>AVAILABLE NOW</Kicker>
          {listings.map((listing) => (
            <Listing key={listing.product} listing={listing} />
          ))}
        </div>
      )}

      {(comingSoon.length > 0 || oneOffs.length > 0) && (
        <div
          className="flex flex-col gap-[14px] pt-5"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)' }}
        >
          <Kicker sage>COMING SOON</Kicker>
          {comingSoon.map((rule) => (
            <Rule key={rule.id} rule={rule} />
          ))}
          {oneOffs.map((forecast) => (
            <OneOff key={forecast.product} forecast={forecast} />
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <span
          className="meta text-[12.5px] leading-[1.6]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
        >
          If it&rsquo;s listed, he said so. If it&rsquo;s greyed, it&rsquo;s been a while.
        </span>
      )}
    </div>
  )
}

function Listing({ listing }: { listing: StandListing }) {
  const stale = listing.status === 'stale'
  const ink = stale ? 'color-mix(in srgb, var(--color-text) 45%, transparent)' : 'var(--color-text)'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-[10px]">
        <span className="text-[21px] font-semibold capitalize leading-[1.2]" style={{ color: ink }}>
          {listing.product}
        </span>
        <InSeason muted={stale} />
      </div>
      <span className="meta text-[13px] leading-[1.5]" style={{ color: ink }}>
        {stale
          ? `available · not confirmed in ${listing.daysSinceSpoken} days`
          : 'available'}
      </span>
    </div>
  )
}

/** A harvest rule, in the farmer's own words. A forecast, never stock. */
function Rule({ rule }: { rule: ActiveRule }) {
  const ink = rule.flagged
    ? 'color-mix(in srgb, var(--color-accent-2-700) 55%, transparent)'
    : 'var(--color-accent-2-700)'
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="flex items-baseline gap-[10px]">
        <span className="text-[19px] font-semibold capitalize leading-[1.2]" style={{ color: ink }}>
          {rule.product}
        </span>
        <InSeason muted={rule.flagged} />
      </div>
      <span className="text-[14px] leading-[1.45]" style={{ color: ink }}>
        &ldquo;{rule.rawPhrase}&rdquo;
      </span>
      {rule.flagged && (
        <span className="meta text-[12.5px] leading-[1.4]" style={{ color: ink }}>
          not confirmed in {rule.daysSinceSpoken} days
        </span>
      )}
    </div>
  )
}

function OneOff({ forecast }: { forecast: ForecastListing }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span
        className="text-[19px] font-semibold capitalize leading-[1.2]"
        style={{ color: 'var(--color-accent-2-700)' }}
      >
        {forecast.product}
      </span>
      <span className="meta text-[13px] leading-[1.5]" style={{ color: 'var(--color-accent-2-700)' }}>
        {forecast.window ? `expected ${shortRange(forecast.window)}` : 'expected soon'}
      </span>
    </div>
  )
}

/**
 * A storefront label, not data. Everything on the stand wears it — the founder's
 * call: what a farm is listing is, by definition, what is in season for it.
 */
function InSeason({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className="meta rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[.04em]"
      style={{
        background: muted ? 'var(--color-neutral-200)' : 'var(--color-accent-2-200)',
        color: muted ? 'var(--color-neutral-500)' : 'var(--color-accent-2-800)',
      }}
    >
      IN SEASON
    </span>
  )
}

function Kicker({ children, sage = false }: { children: React.ReactNode; sage?: boolean }) {
  return (
    <span
      className="meta text-[11px] font-semibold tracking-[0.08em]"
      style={{
        color: sage ? 'var(--color-accent-2-700)' : 'color-mix(in srgb, var(--color-text) 50%, transparent)',
      }}
    >
      {children}
    </span>
  )
}

function EmptyWeek() {
  return (
    <div className="flex flex-col gap-[10px] py-[26px]">
      <span className="text-[23px] leading-[1.25]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
        Nothing listed yet.
      </span>
      <span
        className="text-[15px] leading-[1.6] text-pretty"
        style={{ color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}
      >
        He hasn&rsquo;t told us what&rsquo;s on hand. Rather than guess, this page shows
        you nothing &mdash; that&rsquo;s the deal.
      </span>
    </div>
  )
}

function relativeDays(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - Date.parse(iso)) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function shortRange({ from, to }: { from: string; to: string }): string {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
  return `${fmt(from)} – ${fmt(to)}`
}
