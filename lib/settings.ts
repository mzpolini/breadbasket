/**
 * The numbers an operator might change, read in one place.
 *
 * Environment variables rather than database settings: nobody but us has to
 * change them yet, and a deploy is a fine way to do it until someone does.
 */

/**
 * The freshness window: how long anything he says stays trusted before it is
 * flagged. **Flat seven days, every crop — a temporary POC decision**
 * (NORTHSTAR.md). It is a trust clock (has he checked in?), not a spoilage
 * guess, which is why one number is honest enough for now. Per-crop windows
 * were sketched and deliberately not built.
 */
export const FRESHNESS_DAYS = 7

/** A positive integer from the environment, or the default when it's unset or unusable. */
function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? value : fallback
}

/**
 * When silence turns an item `gone` **in the API**: days since the farmer last
 * said anything about it. Default 7.
 *
 * Independent of `FRESHNESS_DAYS` above, which is when the farm stand *flags* an item
 * stale. The stand keeps showing it, greyed, as the farmer's reminder to check
 * in; a map pin has no greying, so the API has to say yes or no. They happen to
 * share a number today and are not the same decision (ticket 42).
 */
export function goneAfterDays(): number {
  return positiveInt('GONE_AFTER_DAYS', 7)
}

/** Requests per minute per API key. Default 60. */
export function apiRateLimitPerMinute(): number {
  return positiveInt('API_RATE_LIMIT_PER_MIN', 60)
}
