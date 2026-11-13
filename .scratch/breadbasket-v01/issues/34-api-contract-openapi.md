# API contract and generated OpenAPI spec

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: —
Parent: 30 · Brief item 3 (spec for Gabrielle before staging)

## What to build

Write the contract as Zod schemas in `lib/api/contract.ts`. Generate `public/openapi.json` from them with `pnpm api:spec` (a script using `z.toJSONSchema`). Check the file in, and send it to Gabrielle as soon as it exists.

**Endpoints:**

- `GET /api/v1/farms/availability`: bulk. Returns every mapped farm. `?farm_ids=a,b,c` filters to those IDs (max 100). Unknown or unmapped IDs are silently omitted.
- `GET /api/v1/farms/{farm_id}/availability`: a single farm. Returns 404 if the farm doesn't exist or isn't mapped.
- `Authorization: Bearer <key>` on both.

**Farm object:**

| field | type |
|---|---|
| `farm_id` | string, the Breadbasket farm ID (stable) |
| `directory_profile_id` | string |
| `farm_stand_url` | string (URL) |
| `last_updated` | string (RFC 3339) \| null, when the farm last spoke |
| `items` | Item[] |

**Item object:**

| field | type |
|---|---|
| `product` | string |
| `variety` | string \| null |
| `status` | `"in_season" \| "coming_soon" \| "gone"` |
| `last_updated` | string (RFC 3339) |
| `expected_from` | string (date) \| null |
| `available_until` | string (date) \| null |
| `quantity` | number \| null (always null in beta) |
| `unit` | string \| null (always null in beta) |
| `price` | `{ amount: number, currency: "USD", per: string } \| null` (always null in beta) |

**Bulk response:** `{ generated_at, farms: Farm[] }`.

**Errors:** `{ error: { code, message } }` for 401 (missing or invalid key), 403 (revoked key), 404, 429 and 400 (bad `farm_ids`).

**Headers:** document `Cache-Control`, `ETag`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` and `Retry-After` in the spec.

Include a full example response with three farms, covering each status. Gabrielle maps from examples faster than from schemas.

## Done when

- `pnpm api:spec` writes a valid OpenAPI 3.1 document. A test checks that the committed file matches a fresh generation.
- The spec has been sent to Gabrielle.
