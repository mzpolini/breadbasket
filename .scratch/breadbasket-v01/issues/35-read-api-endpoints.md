# Read API: bulk and single-farm endpoints

Type: spec
Status: ready-for-agent
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
