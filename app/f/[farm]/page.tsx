import { notFound } from 'next/navigation'
import { balancesFrom } from '@/lib/ledger'
import { publicListings, type PublicListing } from '@/lib/projections'
import {
  SEED_FARM_ID,
  SEED_FRESHNESS,
  SEED_FRESHNESS_DEFAULT,
  seedMovements,
} from '@/lib/seed'

/**
 * The public availability page.
 *
 * Scaffolding: the markup here is deliberately plain so a design system can
 * replace it wholesale. What is NOT scaffolding is the data flow — movements
 * fold to balances, balances project to listings, and every display rule lives
 * in `lib/projections` so this page cannot invent its own meaning for
 * "estimated" or decide for itself what to hide.
 */
export default async function FarmAvailabilityPage({
  params,
}: {
  params: Promise<{ farm: string }>
}) {
  const { farm } = await params
  if (farm !== SEED_FARM_ID) notFound()

  const now = new Date()
  const balances = balancesFrom(seedMovements(now), {
    now,
    freshnessDays: SEED_FRESHNESS_DEFAULT,
    freshnessByProduct: SEED_FRESHNESS,
  })
  const listings = publicListings(balances, { now })

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">What&rsquo;s fresh this week</h1>

      {listings.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          Nothing listed right now. Everything here expires, so an empty page means
          there&rsquo;s nothing we can vouch for today &mdash; not that something broke.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {listings.map((listing) => (
            <Listing key={listing.product} listing={listing} now={now} />
          ))}
        </ul>
      )}
    </main>
  )
}

function Listing({ listing, now }: { listing: PublicListing; now: Date }) {
  return (
    <li className="py-4">
      <p className="font-medium capitalize">{listing.product}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {listing.quantity
          ? `${listing.quantity.value} ${listing.quantity.unit}`
          : 'available'}
        {' · '}
        {confidenceLabel(listing)}
        {' · '}
        confirmed {relativeDays(listing.confirmedAt, now)}
      </p>
    </li>
  )
}

/**
 * The annotation that degrades as guesses stack up. It is the mechanism that
 * asks for a stocktake without nagging him — so it must read as a page growing
 * less certain, not as an error.
 */
function confidenceLabel(listing: PublicListing): string {
  if (listing.confidence === 'weighed') return 'weighed'
  if (listing.weeksSinceMeasured === null) return 'estimated'

  const weeks = listing.weeksSinceMeasured
  return `estimated · not weighed in ${weeks} week${weeks === 1 ? '' : 's'}`
}

function relativeDays(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - Date.parse(iso)) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
