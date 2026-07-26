import { notFound } from 'next/navigation'
import { CropStack } from '@/app/_components/crop-stack'
import { balancesFrom } from '@/lib/ledger'
import { farmerInventory } from '@/lib/projections'
import {
  SEED_FARM_SECRET,
  SEED_FRESHNESS,
  SEED_FRESHNESS_DEFAULT,
  seedMovements,
} from '@/lib/seed'

/**
 * Surface 2 — the farmer's own view, design direction `1f`.
 *
 * The surface pilot success is measured on, and the one competing with a paper
 * notebook for getting ready on Saturday. Dark ground because it gets used at
 * dusk with a torch in the other hand.
 *
 * Identity is the settled v0.1 model: one farm behind one secret URL, no login.
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

  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col"
      style={{ background: 'var(--color-neutral-900)' }}
    >
      <div
        className="flex justify-between px-6 pb-2 pt-3 text-[12px] font-semibold"
        style={{ color: 'rgba(245,234,216,.65)' }}
      >
        <span>What you&rsquo;ve got</span>
        <span className="meta">{rows.length} crops</span>
      </div>

      <CropStack rows={rows} />
    </main>
  )
}
