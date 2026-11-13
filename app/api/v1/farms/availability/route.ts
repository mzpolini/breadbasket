import { bulkAvailability } from '@/lib/api/availability'
import { apiRoute } from '@/lib/api/route'

/**
 * Availability for every mapped farm, in one call — the one the directory map
 * loads. `apiRoute` checks the API key and the rate limit before this runs.
 */
export const GET = apiRoute((req, _context, now) => bulkAvailability(req, now))
