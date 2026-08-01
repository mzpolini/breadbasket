import { FarmHeader } from '@/app/_components/farm-header'
import { balancesFrom, formatAmount } from '@/lib/ledger'
import { forecastListings, publicListings, type PublicListing } from '@/lib/projections'
import { SEED_FARM_ID, SEED_FRESHNESS, SEED_FRESHNESS_DEFAULT } from '@/lib/seed'
import { movementsForFarm } from '@/lib/storage/movements'

/**
 * Surface 3 — the public availability page (design `1g`).
 *
 * Lapsed crops are **absent, not greyed**. "estimated" is set in the same weight
 * as "weighed": both are honest, one is just rounder. The degrading annotation
 * carries no red and no icon — the page gets quieter about itself rather than
 * raising an alarm.
 *
 * It is a component rather than a page body because two routes need to render it
 * and they must never drift: `/f/<farm>` for buyers, and the farmer's own preview
 * inside his shell. Shared component, not copied markup — otherwise "your page"
 * eventually stops being his page.
 */
export async function AvailabilityCard({ farmId = 'seed-farm' }: { farmId?: string } = {}) {
  const now = new Date()
  const balances = balancesFrom(await movementsForFarm(farmId), {
    now,
    freshnessDays: SEED_FRESHNESS_DEFAULT,
    freshnessByProduct: SEED_FRESHNESS,
  })
  const listings = publicListings(balances, { now })
  const forecasts = forecastListings(balances)

  return (
    <div
      className="flex flex-col gap-[26px] rounded-[34px] px-[26px] pb-[34px] pt-[30px]"
      style={{ background: 'var(--color-bg)', boxShadow: 'var(--shadow-md)' }}
    >
      <FarmHeader />

      {listings.length === 0 ? (
        <EmptyWeek />
      ) : (
        <div className="flex flex-col gap-5">
          {listings.map((listing) => (
            <Listing key={listing.product} listing={listing} now={now} />
          ))}
        </div>
      )}

      {forecasts.length > 0 && (
        <div
          className="flex flex-col gap-2 pt-5"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--color-text) 14%, transparent)' }}
        >
          <span
            className="meta text-[11px] font-semibold tracking-[0.08em]"
            style={{ color: 'var(--color-accent-2-700)' }}
          >
            EXPECTED NEXT WEEK
          </span>
          {forecasts.map((forecast) => (
            <div key={forecast.product} className="flex flex-col gap-[3px]">
              <span
                className="text-[19px] font-semibold capitalize leading-[1.2]"
                style={{ color: 'var(--color-accent-2-700)' }}
              >
                {forecast.product}
                {forecast.quantity && ` · about ${formatAmount(forecast.quantity)}`}
              </span>
              <span
                className="meta text-[13px] leading-[1.5]"
                style={{ color: 'var(--color-accent-2-700)' }}
              >
                a forecast, not stock · {shortRange(forecast.window)}
              </span>
            </div>
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <span
          className="meta text-[12.5px] leading-[1.6]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 50%, transparent)' }}
        >
          Everything here expires. If it&rsquo;s listed, he said so this week.
        </span>
      )}
    </div>
  )
}

function Listing({ listing, now }: { listing: PublicListing; now: Date }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[21px] font-semibold capitalize leading-[1.2]">{listing.product}</span>
      <span className="tnum text-[21px] leading-[1.2]">
        {listing.quantity ? formatAmount(listing.quantity) : 'available'}
      </span>
      <span
        className="meta text-[13px] leading-[1.5]"
        style={{
          color:
            listing.confidence === 'weighed'
              ? 'var(--color-accent-2-800)'
              : 'color-mix(in srgb, var(--color-text) 58%, transparent)',
        }}
      >
        {confidenceLine(listing)} · confirmed {relativeDays(listing.confirmedAt, now)}
      </span>
    </div>
  )
}

/**
 * The annotation that degrades as guesses stack up — the mechanism that asks for
 * a stocktake without nagging. Same ink as everything else, on purpose.
 */
function confidenceLine(listing: PublicListing): string {
  if (listing.quantity === null) return 'he has some'
  if (listing.confidence === 'weighed') return 'weighed'
  if (listing.weeksSinceMeasured === null) return 'estimated'

  const weeks = listing.weeksSinceMeasured
  return `estimated, not weighed in ${weeks} week${weeks === 1 ? '' : 's'}`
}

function EmptyWeek() {
  return (
    <div className="flex flex-col gap-[10px] py-[26px]">
      <span className="text-[23px] leading-[1.25]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
        Nothing listed this week.
      </span>
      <span
        className="text-[15px] leading-[1.6] text-pretty"
        style={{ color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}
      >
        He hasn&rsquo;t been in the field since Saturday. Rather than show you last week&rsquo;s
        list, this page shows you nothing &mdash; that&rsquo;s the deal.
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
