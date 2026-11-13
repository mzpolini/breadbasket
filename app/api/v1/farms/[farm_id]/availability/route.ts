import { farmAvailability } from '@/lib/api/availability'
import { apiRoute } from '@/lib/api/route'

/** Availability for one farm. `apiRoute` checks the API key and the rate limit first. */
export const GET = apiRoute(
  async (req, context: { params: Promise<{ farm_id: string }> }, now) => {
    const { farm_id } = await context.params
    return farmAvailability(req, farm_id, now)
  },
)
