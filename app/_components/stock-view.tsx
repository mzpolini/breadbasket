'use client'

import type { ActiveRule } from '@/lib/cadence'
import type { InventoryRow } from '@/lib/projections'
import { StockList } from './stock-list'

/**
 * Surface 2, following design `1b`: "What you've got".
 *
 * The farmer's current inventory view. Sold out is the only action available
 * here — nothing else changes stock except what he said in the conversation.
 */
export function StockView({
  rows,
  rules,
  now,
  farmId,
}: {
  rows: InventoryRow[]
  rules: ActiveRule[]
  now: Date
  farmId: string
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: 'var(--color-bg)' }}>
      <StockList rows={rows} rules={rules} now={now} farmId={farmId} />
    </div>
  )
}
