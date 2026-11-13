# Read API: bulk and single-farm endpoints

Type: spec
Status: done (pending: a deployed-URL check)
Audience: us
Blocked by: 31, 34, 36
Parent: 30 · Brief item 3

## What to build

Route handlers at the two paths from 34. Read the Next 16 route-handler guide in `node_modules/next/dist/docs/` first (see AGENTS.md).

- **Auth and rate limiting:** call `authenticateApiKey(req)` and the rate limiter from 36 before any database read.
- **Mapped farms:** `kyf_verified AND directory_profile_id IS NOT NULL`.
- **Projection:** add a new pure function `apiItems(balances, rules, { now, goneAfterDays })` in `lib/projections`. It reuses `balancesFrom`, `standListings`, `forecastListings` and `activeRules`. Don't duplicate fold logic.
  - `in_season` means an on-hand position that isn't *none left* and is younger than `goneAfterDays`. `available_until` comes from a matching rule's `ends_on`, otherwise null.
  - `coming_soon` means an active harvest rule (`expected_from = starts_on`) or a dated one-off forecast (`window_from`, `window_to`).
  - `gone` means *none left*, or silent for `goneAfterDays` or more. Include it only within 14 days of going.
- **Bulk performance:** load movements and rules for all requested farms in **two queries** (`farm_id IN (...)`), not one per farm. The map loads every farm at once, so this is the endpoint that matters.
- **Response:** build each object field by field, then validate the output with the contract schema (`.parse`) before sending, so a leak fails loudly instead of shipping.
- **Headers:** `Cache-Control: private, max-age=300`. Weak `ETag` over the body hash. `304` when `If-None-Match` matches.
- Never include emails, phone numbers, raw phrases, notes, messages or user IDs.

## Done when

- With a valid key, one bulk call returns several farms' inventory with every field from 34.
- A revoked key gets 403.
- A contract test validates a real handler response against `public/openapi.json`.
- Unit tests for `apiItems` cover each status, including *none left*, silence past the threshold, the 14-day `gone` cutoff, and harvest-rule dates.

## Outcome

- `GET /api/v1/farms/availability` and `GET /api/v1/farms/{farm_id}/availability`, both written as `apiRoute(...)` (`lib/api/route.ts`): the key is checked and the request counted *before* the handler runs, so a handler can't forget to and nothing is read for a refused caller. The source-reading test in `lib/auth/doors.test.ts` requires it of every route under `app/api/v1/`.
- `apiItems` / `farmLastUpdated` in `lib/projections/api.ts`, built on `balancesFrom` and `activeRules`. One item per crop (in season over coming soon over gone), deterministic order.
- Bulk loads in **three** queries however many farms: mapped farms, then movements and rules each with `farm_id IN (...)`. A test counts them.
- The mapped rule is in the SQL *and* checked again in code (`isMapped`), so a loosened `WHERE` can't publish an unmapped farm.
- Every response is parsed with the contract before sending (strict, so a leak throws), and the contract test validates real handler output against the published `public/openapi.json`.
- The bulk ETag hashes the farms, not `generated_at`, or a `304` could never happen.
- `ProductBalance` gained `lastClaimAt` (any claim, forecasts included) so a forecast can be dated without making it publishable.
- Calls the ticket didn't make: a position sold to exactly zero reads `gone`; a position below zero is left out; a forecast whose window has passed is dropped; an undated forecast is `coming_soon` with null dates; a standing rule is never made gone by silence.
- Contract fix: 401/403 no longer claim `RateLimit-*` headers (there is no key to have a limit); 304 documents them.

**Verified against the real database (Nov 13, local dev server):** migration applied; no key → 401; unknown key → 401; issued key → 200 with `Cache-Control`, `ETag`, `RateLimit-*`; a temporary mapped farm with movements and a rule came back with the right statuses and dates and no leaked phrase or user id; `If-None-Match` → 304; `farm_ids` filter and the 400; exactly 60 requests allowed in a minute, then 429 with `Retry-After`; the key revoked → 403. The temporary farm and its rows were deleted; the test key remains in `api_keys`, revoked. Not yet checked: a deployed URL (`breadbasket-theta.vercel.app`).
