/** Prints the raw movement rows — the only way to tell a display bug from a write bug. */
import { getDb } from '../lib/db'
import { movements } from '../lib/db/schema'

async function main() {
  const rows = await getDb().select().from(movements)
  console.table(
    rows.map((r) => ({
      product: r.product,
      kind: r.kind,
      value: r.amountValue,
      unit: r.amountUnit,
      measured: r.measured,
      at: r.occurredAt,
    })),
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
