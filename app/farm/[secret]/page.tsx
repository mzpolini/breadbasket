import { notFound } from 'next/navigation'
import { balancesFrom } from '@/lib/ledger'
import { farmerInventory, type InventoryRow } from '@/lib/projections'
import {
  SEED_FARM_SECRET,
  SEED_FRESHNESS,
  SEED_FRESHNESS_DEFAULT,
  seedMovements,
} from '@/lib/seed'

/**
 * The farmer's own view — what pilot success is measured on, and what has to
 * beat a paper notebook for getting ready on Saturday.
 *
 * Scaffolding markup, real data flow. Identity is the settled v0.1 model: one
 * farm behind one secret URL, no login and nothing to remember.
 */
export default async function FarmerInventoryPage({
  params,
}: {
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params
  if (secret !== SEED_FARM_SECRET) notFound()

  const now = new Date()
  const rows = farmerInventory(
    balancesFrom(seedMovements(now), {
      now,
      freshnessDays: SEED_FRESHNESS_DEFAULT,
      freshnessByProduct: SEED_FRESHNESS,
    }),
    { now },
  )

  const live = rows.filter((row) => row.live)
  const notLive = rows.filter((row) => !row.live)

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">What you&rsquo;ve got</h1>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {live.map((row) => (
          <Row key={`${row.product}-${row.window.from}`} row={row} />
        ))}
      </ul>

      {notLive.length > 0 && (
        <>
          <h2 className="mt-12 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Not showing publicly
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Lapsed or still to come. Buyers don&rsquo;t see these &mdash; you do, so you
            can tell sold-out from forgotten.
          </p>
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {notLive.map((row) => (
              <Row key={`${row.product}-${row.window.from}`} row={row} />
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

function Row({ row }: { row: InventoryRow }) {
  return (
    <li className="py-4">
      <p className="font-medium capitalize">{row.product}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {row.quantity ? `${row.quantity.value} ${row.quantity.unit}` : 'available'}
        {' · '}
        {row.confidence}
        {row.weeksSinceMeasured !== null && ` · not weighed in ${row.weeksSinceMeasured}w`}
      </p>
      {row.attention && (
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
          {attentionLabel(row.attention)}
        </p>
      )}
    </li>
  )
}

function attentionLabel(attention: NonNullable<InventoryRow['attention']>): string {
  switch (attention) {
    case 'unit-conflict':
      return 'You gave two different units for this — I can’t work out a total.'
    case 'negative':
      return 'This has gone below zero, so something’s missing. Worth a fresh count.'
    case 'needs-weighing':
      return 'These have been guesses for a while — worth putting on the scale.'
  }
}
