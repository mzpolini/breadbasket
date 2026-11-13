/**
 * A disposable demo farm, so the directory team has a full range of statuses to
 * map against while the real farms are still thin: `pnpm db:demo`.
 *
 * Every date is relative to *now*, so the demo only stays interesting if it is
 * re-seeded — run it again any time and it rebuilds from scratch. `--remove`
 * deletes it, and should be run before the real launch.
 *
 * Touches **only** `DEMO_FARM_ID`, which is hard-coded here and checked on every
 * delete. This breaks the ledger's append-only rule on purpose: the demo is not
 * anyone's record, and a farm that can't be reset can't be a demo. Real farms
 * never go through here.
 *
 * It is KYF-verified and has a directory profile ID, so it appears in the API and
 * on a public stand. Its name says what it is.
 */
import { eq } from 'drizzle-orm'
import { getDb } from '../lib/db'
import { farms, harvestRules, messages, movements, notes } from '../lib/db/schema'

const DEMO_FARM_ID = 'farm_demofarm001'
const DEMO_PROFILE_ID = 'demo-profile-1'
const DAY = 24 * 60 * 60 * 1000

async function wipe() {
  const db = getDb()
  // Guarded: this function exists to delete a farm's history, so it must be
  // impossible for it to be pointed at a real one.
  if (DEMO_FARM_ID !== 'farm_demofarm001') throw new Error('refusing to wipe anything but the demo farm')
  await db.delete(movements).where(eq(movements.farmId, DEMO_FARM_ID))
  await db.delete(harvestRules).where(eq(harvestRules.farmId, DEMO_FARM_ID))
  await db.delete(notes).where(eq(notes.farmId, DEMO_FARM_ID))
  await db.delete(messages).where(eq(messages.farmId, DEMO_FARM_ID))
}

async function main() {
  const db = getDb()
  const now = Date.now()
  const ago = (days: number) => new Date(now - days * DAY)
  const date = (daysFromNow: number) => new Date(now + daysFromNow * DAY).toISOString().slice(0, 10)

  await wipe()

  if (process.argv.includes('--remove')) {
    await db.delete(farms).where(eq(farms.id, DEMO_FARM_ID))
    console.log('demo farm removed')
    return
  }

  await db
    .insert(farms)
    .values({
      id: DEMO_FARM_ID,
      name: 'Demo Farm (sample data)',
      slug: 'demo-farm',
      directoryProfileId: DEMO_PROFILE_ID,
      kyfVerified: true,
      tagline: 'Sample data, not a real farm',
      market: 'for testing the directory connection',
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: farms.id,
      set: {
        name: 'Demo Farm (sample data)',
        slug: 'demo-farm',
        directoryProfileId: DEMO_PROFILE_ID,
        kyfVerified: true,
        tagline: 'Sample data, not a real farm',
        market: 'for testing the directory connection',
      },
    })

  const m = (product: string, kind: string, at: Date, extra: Record<string, unknown> = {}) => ({
    id: crypto.randomUUID(),
    farmId: DEMO_FARM_ID,
    product,
    rawPhrase: 'demo',
    kind,
    measured: false,
    state: 'confirmed',
    source: 'farmer',
    sessionId: 'demo',
    occurredAt: at,
    ...extra,
  })

  await db.insert(movements).values([
    // in_season: weighed this morning; presence only; and one with a standing rule's end date.
    m('heirloom tomatoes', 'trueup', ago(0.1), { amountValue: 50, amountUnit: 'lb', measured: true }),
    m('collard greens', 'trueup', ago(1)),
    m('sweet potatoes', 'trueup', ago(2)),
    // gone, the two ways: he said so, and the silence ran out (9 days, inside the 14-day window).
    m('summer squash', 'add', ago(4), { amountValue: 20, amountUnit: 'lb' }),
    m('summer squash', 'remove', ago(2), { reason: 'sold' }),
    m('mustard greens', 'trueup', ago(9)),
    // coming_soon, dated: a one-off forecast with its window.
    m('head lettuce', 'trueup', ago(1), {
      state: 'forecast',
      windowFrom: date(6),
      windowTo: date(13),
    }),
  ])

  await db.insert(harvestRules).values([
    {
      id: crypto.randomUUID(),
      farmId: DEMO_FARM_ID,
      product: 'watermelon',
      rawPhrase: 'demo',
      interval: 'weekly',
      startsOn: date(10),
      endsOn: date(120),
      ended: false,
      createdAt: ago(1),
    },
    {
      id: crypto.randomUUID(),
      farmId: DEMO_FARM_ID,
      product: 'sweet potatoes',
      rawPhrase: 'demo',
      interval: 'weekly',
      endsOn: date(45),
      ended: false,
      createdAt: ago(1),
    },
  ])

  console.log(`demo farm ready: ${DEMO_FARM_ID} (profile ${DEMO_PROFILE_ID}) → /f/demo-farm`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
