import Link from 'next/link'
import { StockView } from '@/app/_components/stock-view'
import { activeRules } from '@/lib/cadence'
import { balancesFrom } from '@/lib/ledger'
import { farmerInventory } from '@/lib/projections'
import { FRESHNESS_DAYS } from '@/lib/seed'
import { rulesForFarm } from '@/lib/storage/harvest-rules'
import { movementsForFarm } from '@/lib/storage/movements'

/**
 * Surface 2 — his own stock.
 *
 * Two views of one projection: the comprehensive list he lands on, and the `1f`
 * walkthrough for the pre-market pass. Both read the same `farmerInventory`
 * rows, so they can never disagree about what he has.
 *
 * This only has something to show once he has talked to the agent, because
 * everything here is derived from what he said — there is no separate inventory
 * to edit, and that is the design.
 */
export default async function FarmerStockPage({
  params,
}: {
  params: Promise<{ farmId: string }>
}) {
  const { farmId } = await params
  const now = new Date()

  const [movements, storedRules] = await Promise.all([movementsForFarm(farmId), rulesForFarm(farmId)])
  const rows = farmerInventory(balancesFrom(movements, { now, freshnessDays: FRESHNESS_DAYS }), { now })
  const rules = activeRules(storedRules, { now, freshnessDays: FRESHNESS_DAYS })

  if (rows.length === 0 && rules.length === 0) {
    return (
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="text-[26px]" style={{ fontFamily: 'var(--font-caprasimo)' }}>
          Nothing here yet.
        </span>
        <span
          className="text-[15px] leading-[1.6]"
          style={{ color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}
        >
          This only knows what you&rsquo;ve told it. Have a word with it first and your
          crops will show up here.
        </span>
        <Link href={`/farm/${farmId}`} className="btn btn-primary mt-2">
          Tell it what you&rsquo;ve got
        </Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <StockView rows={rows} rules={rules} now={now} farmId={farmId} />
    </main>
  )
}
