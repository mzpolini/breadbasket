import { z } from 'zod'
import { MAX_FARM_IDS, registry } from './contract'
import { EXAMPLE_BULK_RESPONSE } from './example'

/**
 * The OpenAPI 3.1 document for the public read API, built from the contract.
 *
 * Pure and deterministic — same schemas in, byte-identical document out — so a
 * test can hold the committed `public/openapi.json` to what the code would
 * generate, and the shared spec can never quietly fall behind the API.
 */

export const API_VERSION = '1.0.0-beta.1'

export const RATE_LIMIT_PER_MINUTE = 60
export const CACHE_MAX_AGE_SECONDS = 300

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

/**
 * JSON Schema as Zod emits it, trimmed for OpenAPI: no per-component `$schema`
 * or `$id` (the document declares the dialect once), and no regex `pattern` on
 * dates — `format` says the same thing in a form people can read.
 */
function tidy(node: Json): Json {
  if (Array.isArray(node)) return node.map(tidy)
  if (node === null || typeof node !== 'object') return node

  const out: { [key: string]: Json } = {}
  const isDate = node.format === 'date' || node.format === 'date-time'
  for (const [key, value] of Object.entries(node)) {
    if (key === '$schema' || key === '$id') continue
    if (key === 'pattern' && isDate) continue
    out[key] = tidy(value)
  }
  return out
}

function componentSchemas(): { [key: string]: Json } {
  const { schemas } = z.toJSONSchema(registry, {
    target: 'draft-2020-12',
    uri: (id) => `#/components/schemas/${id}`,
  })
  return tidy(schemas as Json) as { [key: string]: Json }
}

const ref = (id: string) => ({ $ref: `#/components/schemas/${id}` })

const RATE_HEADERS = ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']

/**
 * `rateHeaders: false` for 401 and 403: no valid key means no limit to report,
 * and a revoked key's requests aren't counted.
 */
const error = (
  description: string,
  code: string,
  message: string,
  extraHeaders: string[] = [],
  rateHeaders = true,
) => ({
  description,
  headers: Object.fromEntries(
    [...(rateHeaders ? RATE_HEADERS : []), ...extraHeaders].map((h) => [
      h,
      { $ref: `#/components/headers/${h}` },
    ]),
  ),
  content: {
    'application/json': {
      schema: ref('ErrorResponse'),
      example: { error: { code, message } },
    },
  },
})

const okHeaders = Object.fromEntries(
  ['Cache-Control', 'ETag', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'].map(
    (h) => [h, { $ref: `#/components/headers/${h}` }],
  ),
)

const commonErrors = {
  '304': {
    description: 'Not modified — the `If-None-Match` ETag still matches. No body.',
    headers: Object.fromEntries(
      ['Cache-Control', 'ETag', ...RATE_HEADERS].map((h) => [h, { $ref: `#/components/headers/${h}` }]),
    ),
  },
  '401': error('Missing or unknown API key.', 'unauthorized', 'A valid API key is required.', [], false),
  '403': error('The API key has been revoked.', 'key_revoked', 'This API key has been revoked.', [], false),
  '429': error(
    `More than ${RATE_LIMIT_PER_MINUTE} requests in a minute on this key.`,
    'rate_limited',
    'Rate limit exceeded. Retry after the number of seconds in Retry-After.',
    ['Retry-After'],
  ),
}

export function buildOpenApiDocument() {
  const exampleFarm = EXAMPLE_BULK_RESPONSE.farms[0]

  return {
    openapi: '3.1.0',
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    info: {
      title: 'Breadbasket availability API',
      version: API_VERSION,
      description: [
        'Read-only availability for farms in the Mid-Atlantic Black Farmers Cooperative directory.',
        '',
        'Breadbasket is the source of truth for what a farm has. Farmers tell Breadbasket in plain ' +
          'language; this API reports it as a list of items per farm.',
        '',
        '**Which farms appear.** Only farms that are KYF-verified *and* mapped to a directory ' +
          'profile. Any other farm ID behaves exactly like one that does not exist.',
        '',
        '**Public data only.** No emails, phone numbers, or anything the farmer said verbatim.',
        '',
        '**Quantities and prices** are in the schema so they can be filled in later without a ' +
          'breaking change. During the beta they are always `null`.',
        '',
        `**Caching.** Responses may be cached for ${CACHE_MAX_AGE_SECONDS / 60} minutes. Send ` +
          '`If-None-Match` with the last `ETag` to get a `304` when nothing changed.',
        '',
        `**Rate limit.** ${RATE_LIMIT_PER_MINUTE} requests per minute per key. Every response ` +
          'carries `RateLimit-*` headers; a `429` carries `Retry-After`.',
        '',
        '**Keys.** Development, staging and production keys are separate and do not work across environments. ' +
          'A revoked key gets `403`; ask a Breadbasket admin for a new one.',
      ].join('\n'),
    },
    servers: [
      {
        url: 'https://breadbasket-theta.vercel.app/api/v1',
        description: 'Development (the endpoints answer here once they are built)',
      },
      { url: 'https://breadbasket.example/api/v1', description: 'Production (URL to be confirmed)' },
      { url: 'https://staging.breadbasket.example/api/v1', description: 'Staging (URL to be confirmed)' },
    ],
    security: [{ apiKey: [] }],
    paths: {
      '/farms/availability': {
        get: {
          operationId: 'listFarmAvailability',
          summary: 'Availability for every mapped farm, or for a list of farms',
          description:
            'The call the directory map should use: one request returns every farm. ' +
            'Pass `farm_ids` to limit the response to particular farms; IDs that do not exist or ' +
            'are not mapped are left out rather than reported as errors.',
          parameters: [
            {
              name: 'farm_ids',
              in: 'query',
              required: false,
              description: `Comma-separated Breadbasket farm IDs, at most ${MAX_FARM_IDS}.`,
              schema: { type: 'string' },
              example: 'farm_k3x9q2m7v1ta,farm_7hd02pq8zc4n',
            },
            { $ref: '#/components/parameters/IfNoneMatch' },
          ],
          responses: {
            '200': {
              description: 'Every requested farm that exists and is mapped.',
              headers: okHeaders,
              content: {
                'application/json': {
                  schema: ref('BulkAvailabilityResponse'),
                  example: EXAMPLE_BULK_RESPONSE,
                },
              },
            },
            '400': error(
              '`farm_ids` is malformed or lists too many farms.',
              'bad_request',
              `farm_ids accepts at most ${MAX_FARM_IDS} IDs.`,
            ),
            ...commonErrors,
          },
        },
      },
      '/farms/{farm_id}/availability': {
        get: {
          operationId: 'getFarmAvailability',
          summary: 'Availability for one farm',
          parameters: [
            {
              name: 'farm_id',
              in: 'path',
              required: true,
              description: 'The Breadbasket farm ID.',
              schema: { type: 'string' },
              example: exampleFarm.farm_id,
            },
            { $ref: '#/components/parameters/IfNoneMatch' },
          ],
          responses: {
            '200': {
              description: 'The farm and its current availability.',
              headers: okHeaders,
              content: {
                'application/json': { schema: ref('FarmAvailability'), example: exampleFarm },
              },
            },
            '404': error(
              'No such farm, or the farm is not KYF-verified and mapped.',
              'not_found',
              'Farm not found.',
            ),
            ...commonErrors,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'http',
          scheme: 'bearer',
          description:
            'Send `Authorization: Bearer <key>`. Production keys start `bb_live_`, staging keys `bb_test_`.',
        },
      },
      parameters: {
        IfNoneMatch: {
          name: 'If-None-Match',
          in: 'header',
          required: false,
          description: 'The `ETag` from a previous response. Returns `304` if unchanged.',
          schema: { type: 'string' },
        },
      },
      headers: {
        'Cache-Control': {
          description: `\`private, max-age=${CACHE_MAX_AGE_SECONDS}\``,
          schema: { type: 'string' },
        },
        ETag: { description: 'A weak validator for the response body.', schema: { type: 'string' } },
        'RateLimit-Limit': {
          description: 'Requests allowed per minute on this key.',
          schema: { type: 'integer' },
        },
        'RateLimit-Remaining': {
          description: 'Requests left in the current minute.',
          schema: { type: 'integer' },
        },
        'RateLimit-Reset': {
          description: 'Seconds until the current minute resets.',
          schema: { type: 'integer' },
        },
        'Retry-After': {
          description: 'Seconds to wait before retrying.',
          schema: { type: 'integer' },
        },
      },
      schemas: componentSchemas(),
    },
  }
}

/** The document as it is written to disk: two-space JSON with a trailing newline. */
export function renderOpenApiDocument(): string {
  return `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`
}
