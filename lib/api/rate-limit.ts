import { apiRateLimitPerMinute } from '../settings'
import { countRequest, deleteWindowsBefore } from '../storage/api-keys'
import { rateStatus, windowStart, type RateStatus } from './key-format'

const ONE_HOUR_MS = 60 * 60 * 1000

/** About one request in a hundred sweeps the old windows. */
const SWEEP_PROBABILITY = 0.01

/**
 * Count this request against its key and say where the key now stands.
 *
 * Counted whether or not it is then refused, so a client hammering past the
 * limit stays past it rather than being let back in by its own rejections.
 */
export async function checkRateLimit(
  keyId: string,
  now: Date = new Date(),
  random: () => number = Math.random,
): Promise<RateStatus> {
  const count = await countRequest(keyId, windowStart(now))

  // Awaited: a fire-and-forget delete can lose the race with the function
  // shutting down. It is rare, and one DELETE.
  if (random() < SWEEP_PROBABILITY) {
    await deleteWindowsBefore(new Date(now.getTime() - ONE_HOUR_MS))
  }

  return rateStatus(count, apiRateLimitPerMinute(), now)
}
