import { balancesFrom } from '../ledger'
import type { HarvestRule } from '../cadence'
import type { FarmRow } from '../db/schema'
import type { Movement } from '../ledger'
import { farmStandUrl, isMapped } from '../farms'
import { apiItems, farmLastUpdated } from '../projections'
import { FRESHNESS_DAYS, goneAfterDays } from '../settings'
import { mappedFarms } from '../storage/farms'
import { rulesForFarms } from '../storage/harvest-rules'
import { movementsForFarms } from '../storage/movements'
import {
  BulkAvailabilityResponse,
  FarmAvailability,
  MAX_FARM_IDS,
  type FarmAvailability as FarmAvailabilityBody,
} from './contract'
import { ApiError, type ApiResult } from './route'

/**
 * The two endpoints' logic, apart from the transport (`apiRoute` does auth,
 * rate limiting and caching headers).
 *
 * Every response is built field by field and then **parsed against the
 * contract** before it leaves. The contract is strict, so a key that isn't in
 * it — an email, a raw sentence, a user id — fails here, loudly, instead of
 * shipping.
 */

/** Everything for the farms asked about, read in two queries however many there are. */
async function loadAvailability(
  farms: (FarmRow & { directoryProfileId: string })[],
  baseUrl: string,
  now: Date,
): Promise<FarmAvailabilityBody[]> {
  const ids = farms.map((farm) => farm.id)
  const [movements, rules] = await Promise.all([movementsForFarms(ids), rulesForFarms(ids)])

  const movementsByFarm = groupBy(movements, (m: Movement) => m.farmId)
  const rulesByFarm = groupBy(rules, (r: HarvestRule) => r.farmId)
  const gone = goneAfterDays()

  return farms.map((farm) => {
    const balances = balancesFrom(movementsByFarm.get(farm.id) ?? [], {
      now,
      freshnessDays: FRESHNESS_DAYS,
    })
    const farmRules = rulesByFarm.get(farm.id) ?? []

    return FarmAvailability.parse({
      farm_id: farm.id,
      directory_profile_id: farm.directoryProfileId,
      farm_stand_url: farmStandUrl(farm, baseUrl),
      last_updated: farmLastUpdated(balances, farmRules),
      items: apiItems(balances, farmRules, { now, goneAfterDays: gone }),
    })
  })
}

/** Where farm stand URLs point: the configured public URL, else the host asked. */
function baseUrlFor(req: Request): string {
  return process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin
}

function groupBy<T>(list: T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of list) {
    const k = key(item)
    const group = groups.get(k)
    if (group) group.push(item)
    else groups.set(k, [item])
  }
  return groups
}

/** `?farm_ids=a,b,c` → the IDs, or a 400. Absent means every mapped farm. */
function parseFarmIds(req: Request): string[] | undefined {
  const raw = new URL(req.url).searchParams.get('farm_ids')
  if (raw === null) return undefined

  const ids = [...new Set(raw.split(',').map((id) => id.trim()))]
  if (ids.some((id) => id === '')) {
    throw new ApiError(400, 'bad_request', 'farm_ids must be a comma-separated list of farm IDs.')
  }
  if (ids.length > MAX_FARM_IDS) {
    throw new ApiError(400, 'bad_request', `farm_ids accepts at most ${MAX_FARM_IDS} IDs.`)
  }
  return ids
}

/** Every mapped farm, or those named by `farm_ids`. */
export async function bulkAvailability(req: Request, now: Date): Promise<ApiResult> {
  const requested = parseFarmIds(req)
  const farms = (await mappedFarms(requested)).filter(isMapped)
  const loaded = await loadAvailability(farms, baseUrlFor(req), now)

  return {
    body: BulkAvailabilityResponse.parse({ generated_at: now.toISOString(), farms: loaded }),
    // Without `generated_at`, which is different on every call.
    etagOf: loaded,
  }
}

/** One farm; a farm that isn't mapped is a 404, same as one that doesn't exist. */
export async function farmAvailability(
  req: Request,
  farmId: string,
  now: Date,
): Promise<ApiResult> {
  const [farm] = (await mappedFarms([farmId])).filter(isMapped)
  if (!farm) throw new ApiError(404, 'not_found', 'Farm not found.')

  const [loaded] = await loadAvailability([farm], baseUrlFor(req), now)
  return { body: loaded }
}
