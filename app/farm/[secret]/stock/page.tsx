import Link from 'next/link'
import { CropStack } from '@/app/_components/crop-stack'
import { balancesFrom } from '@/lib/ledger'
import { farmerInventory } from '@/lib/projections'
import { SEED_FARM_ID, SEED_FRESHNESS, SEED_FRESHNESS_DEFAULT } from '@/lib/seed'
import { movementsForFarm } from '@/lib/storage/movements'

/**
 * Surface 2 — his own stock, design direction `1f`.
 *
 * One crop, one card, one thumb, ordered so what needs him comes first. Dark
 * ground because it gets used at dusk with a torch in the other hand — which is
 * why the shell's bar is dark too, so the two meet rather than clash.
 *
 * A pass rather than a browse: the footer counts down and then it goes up. This
 * only has something to walk through once he has talked to the agent, because
 * everything here is derived from what he said.
 */
export default async function FarmerStockPage({
  params,
}: {
  params: Promise<{ secret: string }>
}) {
  const { secret } = await params
  const now = new Date()

  const rows = farmerInventory(
    balancesFrom(await movementsForFarm(SEED_FARM_ID), {
      now,
      freshnessDays: SEED_FRESHNESS_DEFAULT,
      freshnessByProduct: SEED_FRESHNESS,
    }),
    { now },
  )

  return (
    <main
      className="mx-auto flex w-full max-w-[560px] flex-1 flex-col"
      style={{ background: 'var(--color-neutral-900)' }}
    >
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span
            className="text-[26px]"
            style={{ fontFamily: 'var(--font-caprasimo)', color: 'var(--color-bg)' }}
          >
            Nothing here yet.
          </span>
          <span className="text-[15px]" style={{ color: 'rgba(245,234,216,.6)' }}>
            This only knows what you&rsquo;ve told it. Have a word with it first and your
            crops will show up here.
          </span>
          <Link href={`/farm/${secret}`} className="btn btn-primary mt-2">
            Tell it what you&rsquo;ve got
          </Link>
        </div>
      ) : (
        <CropStack rows={rows} />
      )}
    </main>
  )
}
