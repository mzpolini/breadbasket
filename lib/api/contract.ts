import { z } from 'zod'

/**
 * The public read API's contract — the one thing the MABFC directory builds
 * against.
 *
 * These schemas are the source of truth twice over: the OpenAPI document is
 * generated from them (`pnpm api:spec`), and the route handlers parse their own
 * output through them before sending it. So the document can't describe a
 * response the code doesn't send, and a column added to a table can't leak into
 * a response without failing loudly first.
 *
 * Every object is `strict`: an unexpected key is an error, not a pass-through.
 * That is the "public data only" promise — no emails, phone numbers, raw farmer
 * messages or user ids — enforced by the parser rather than by care.
 *
 * Field names are snake_case because that's what the consumer reads, and they
 * are deliberately not the internal ones: the API names what the directory
 * needs (`in_season`), not how the ledger models it (on hand, flagged, none left).
 */

export const registry = z.registry<{ id: string }>()

export const ItemStatus = z
  .enum(['in_season', 'coming_soon', 'gone'])
  .describe(
    '`in_season`: the farm has it now. `coming_soon`: the farm expects it — see `expected_from`. ' +
      '`gone`: the farm said it is gone, or has not mentioned it for long enough that it should ' +
      'not be shown as available. Gone items are included for 14 days after they go, so a ' +
      'consumer can remove them, and are then omitted.',
  )
registry.add(ItemStatus, { id: 'ItemStatus' })

const isoDate = z.iso.date().describe('A calendar date, `YYYY-MM-DD`, in the farm\'s local time.')
const isoDateTime = z.iso.datetime({ offset: true }).describe('An RFC 3339 timestamp.')

export const Price = z
  .strictObject({
    amount: z.number().nonnegative(),
    currency: z.literal('USD'),
    per: z.string().describe('What the price is for, e.g. `lb`, `each`, `bunch`.'),
  })
  .describe('Not yet published. Always `null` during the beta.')
registry.add(Price, { id: 'Price' })

export const Item = z
  .strictObject({
    product: z.string().min(1).describe('The crop, in the farm\'s own words, lowercased — e.g. `heirloom tomatoes`.'),
    variety: z
      .string()
      .min(1)
      .nullable()
      .describe('A named variety of the crop — e.g. `brandywine`. `null` when none was named. Always `null` until varieties ship.'),
    status: ItemStatus,
    last_updated: isoDateTime.describe('When the farm last said anything about this item.'),
    expected_from: isoDate
      .nullable()
      .describe('For `coming_soon`: when the farm expects it. `null` when the farm gave no date.'),
    available_until: isoDate
      .nullable()
      .describe('When the farm expects it to end, if it said. `null` otherwise.'),
    quantity: z.number().nonnegative().nullable().describe('Not yet published. Always `null` during the beta.'),
    unit: z.string().nullable().describe('Not yet published. Always `null` during the beta.'),
    price: Price.nullable(),
  })
  .describe('One crop (and, where named, variety) at one farm.')
registry.add(Item, { id: 'Item' })

export const FarmAvailability = z
  .strictObject({
    farm_id: z
      .string()
      .min(1)
      .describe('The Breadbasket farm ID. Stable: it never changes, so it is safe to store and join on.'),
    directory_profile_id: z.string().min(1).describe('The MABFC directory profile this farm maps to.'),
    farm_stand_url: z.url().describe('The farm\'s public Breadbasket farm stand page.'),
    last_updated: isoDateTime
      .nullable()
      .describe('When the farm last said anything about its availability. `null` if it never has.'),
    items: z.array(Item),
  })
  .describe('A farm that is KYF-verified and mapped to a directory profile, with its current availability.')
registry.add(FarmAvailability, { id: 'FarmAvailability' })

export const BulkAvailabilityResponse = z.strictObject({
  generated_at: isoDateTime.describe('When this response was built.'),
  farms: z.array(FarmAvailability),
})
registry.add(BulkAvailabilityResponse, { id: 'BulkAvailabilityResponse' })

export const ErrorCode = z.enum([
  'unauthorized',
  'key_revoked',
  'not_found',
  'bad_request',
  'rate_limited',
])
registry.add(ErrorCode, { id: 'ErrorCode' })

export const ErrorResponse = z.strictObject({
  error: z.strictObject({
    code: ErrorCode,
    message: z.string().describe('Human-readable. Do not match on it; match on `code`.'),
  }),
})
registry.add(ErrorResponse, { id: 'ErrorResponse' })

/** `?farm_ids=a,b,c` — at most this many. */
export const MAX_FARM_IDS = 100

export type ItemStatus = z.infer<typeof ItemStatus>
export type Item = z.infer<typeof Item>
export type FarmAvailability = z.infer<typeof FarmAvailability>
export type BulkAvailabilityResponse = z.infer<typeof BulkAvailabilityResponse>
export type ErrorCode = z.infer<typeof ErrorCode>
export type ErrorResponse = z.infer<typeof ErrorResponse>
