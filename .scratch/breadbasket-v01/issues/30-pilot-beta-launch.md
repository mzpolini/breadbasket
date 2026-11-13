# Pilot beta: shared farms, a read API for the directory, and an admin who can see everything

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: —

Source: *Breadbasket Build Plan for November 12* (the brief). Tickets 31–44 implement this spec.

## Problem Statement

On **Thursday, November 19** Breadbasket goes from one seed farm to two or three real pilot farms, and the farms start using it the week of **Monday, November 16**. The MABFC directory will start reading availability from Breadbasket to show on its map.

What's in the codebase today falls short in five ways:

- **The farm stand only works for the seed farm.** `app/f/[farm]/page.tsx` returns 404 for any ID other than `seed-farm`. A pilot farm would have no public page.
- **We can't tell who said what.** `movements`, `harvest_rules`, `notes` and `messages` are already keyed by farm (good: several users on one farm already share one inventory), but none of them records which person posted. Once two people from the same farm are talking to the app, the record can't say which of them claimed the okra.
- **The farm has no fields the directory needs**: no MABFC directory profile ID, no KYF-verified flag, and no stable public URL separate from the ID.
- **Nothing can read Breadbasket from outside.** There is no public API, no API keys, no rate limiting, and no contract for Gabrielle to build against.
- **An admin can't onboard or debug a farm.** The admin page can create a farm and assign someone who has *already* signed up. It can't invite anyone, can't show who has logged in, and can't show what a person said or how it was parsed.

## Solution

One release, built in the order below. Each step unblocks the next.

1. **Farm record and attribution (31).** Add the directory fields to the farm, and record the posting user on every write. The farm ID stays the Breadbasket farm ID and never changes. A separate slug carries the public URL.
2. **Roles held to account (32).** The admin/farmer split already exists in `lib/auth/current-user.ts`. Audit every route and server action against it and lock it in with tests.
3. **A farm stand per farm, KYF-gated (33).** `/f/<slug>` renders any KYF-verified farm. An unverified farm gets a 404, but the farmer's own preview still works.
4. **Contract first (34).** Write the API's Zod schemas, then generate the OpenAPI document from them, so Gabrielle can start mapping before staging exists.
5. **The read API (35) behind keys (36).** A bulk endpoint and a single-farm endpoint. Hashed API keys scoped to an environment, revocable from the admin page. About 60 requests a minute per key. Cacheable for 5 minutes.
6. **Admin, in the brief's order (37–41).** Invite people with Clerk's built-in invitations, view sign-ups, view inventory, view the activity log, edit a farm. Stop wherever time runs out.
7. **When an item is gone (42).** A configurable silence threshold, default 7 days, that only affects the API (see the founder callout below).
8. **Staging (43)** with four seeded farms whose IDs never change, and a staging key for Gabrielle.
9. **LLM key and usage (44).** A dedicated AI Gateway key, and tokens and cost logged per message so usage can be tracked per farm.

## Answers to the brief's questions

**What already exists?** Multi-tenant tables, per-farm inventory, two roles, farm access checks, admin farm creation and assignment, the farm stand and preview components, and LLM parsing with read-backs. Before this spec, items 1 and 2 were mostly done, item 4 was a start, and items 3, 5 (as specified), 6 and 7 were not started.

**Per farmer or per farm?** **Per farm already.** Every inventory table carries `farm_id`, and `users.farm_id` lets any number of people share one farm. The migration is purely additive: new nullable columns (`farms.slug`, `directory_profile_id`, `kyf_verified`; `posted_by` on the four write tables) plus two new tables (`invitations`, `api_keys`) and an `llm_usage` table. No backfill is needed beyond setting `slug = id` on existing farms. Existing rows keep `posted_by = null`, which means "before attribution existed".

**Can Clerk's invitation emails cover the beta?** **Yes.** `clerkClient().invitations.createInvitation({ emailAddress, redirectUrl, publicMetadata })` sends Clerk's own invitation email, so no separate email service is needed. Set the Clerk instance to **Restricted** sign-up mode so only invited emails can create accounts. Ticket 37 checks this end to end on the production instance. If it fails, the fallback is to copy the invitation URL from the admin page and send it by hand.

**Cut line.** See *Milestones*. In short: farms can sign in and post by Sunday night, Gabrielle has the spec by Saturday, and the API is on staging by Tuesday.

## Founder callout: "gone"

The brief says to mark an item gone after 7 days without an update. The product's current rule (CONTEXT.md, *Flagged*; NORTHSTAR "flag, don't delete") is the opposite on the farm stand: silence never removes anything. A stale item stays on the page, greyed and dated, as the farmer's reminder to check in.

**Proposed reconciliation (ticket 42):** the two surfaces answer different questions, so they apply different rules.

- **Farm stand:** unchanged. Flagged items stay visible and visibly stale.
- **API / directory map:** an item silent for N days (a setting, default 7) is reported as `gone`. A map is used to decide whether to drive somewhere, and a greyed tomato has no meaning on a map pin.

**Option B:** apply `gone` on both surfaces. This simplifies the model, but stale items disappear without a trace and the stand stops working as a reminder to check in.

Thelonious decides. Until he does, 42 is built as the proposal, because that's the reversible choice.

## User Stories

1. As a farmer, I want my partner and me to sign in separately and see one shared inventory, so that neither of us has to repeat what the other said.
2. As a farmer, I want my updates recorded as mine, so that when something on the stand is wrong we can tell who said it.
3. As a farmer, I want to be unable to see or change another farm, so that my record is mine.
4. As a customer, I want each pilot farm to have its own farm stand URL.
5. As the directory (Gabrielle), I want one request that returns every mapped farm's availability, so the map loads in one call.
6. As the directory, I want stable farm IDs and my profile ID echoed back, so I can join Breadbasket data to my records without guessing.
7. As the directory, I want a spec before staging exists, so I can build in parallel.
8. As an admin, I want to revoke a leaked key and issue a new one without a deploy.
9. As an admin, I want to add a farm, invite its people, and see who has actually logged in.
10. As an admin, I want to see exactly what a person sent, what Breadbasket understood, and what it wrote, so I can debug a wrong stand in minutes.
11. As Breadbasket, I want LLM spend tracked separately and per farm, so I know what a farm costs to run.

## Implementation Decisions

- **Farm ID.** `farms.id` *is* the Breadbasket farm ID: immutable, never shown as a URL slug for new farms, and generated as `farm_<nanoid>`. Existing `seed-farm` keeps its ID. The public URL comes from a new `farms.slug` (unique, editable). This replaces the comment in `lib/storage/farms.ts` that says `id` should be a human-readable slug.
- **Which farms are "mapped".** A farm appears in the API only if `kyf_verified = true` **and** `directory_profile_id IS NOT NULL`. A single-farm request for any other farm returns 404, the same as for a farm that doesn't exist, so the API doesn't reveal which farms exist.
- **Attribution.** `posted_by text null` (Clerk user ID) on `movements`, `harvest_rules`, `notes` and `messages`. On `messages`, assistant turns carry the ID of the user whose message triggered them. The value comes from the session on the server, never from the client body.
- **Status mapping (API only).** `in_season` means an on-hand position that isn't *none left* and hasn't been silent for N days or more. `coming_soon` means an active harvest rule or a dated one-off forecast. `gone` means *none left*, or silent for N days or more. `gone` items are included for 14 days after they go, so the consumer can remove its pins, and then omitted.
- **Variety.** Returned as `variety: string | null`. It stays `null` until spec 29 (crops and varieties) lands. The field is in the contract from day one so adding varieties doesn't change the API.
- **Quantity, unit, price.** In the schema as optional and always `null` in the beta, because the farm stand promises no quantities (CONTEXT.md, *Storefront*). Exposing them is a later product decision, not a code change to the contract.
- **Public data only.** Response objects are built by hand from projections, never by spreading rows, so a new column can't leak. A contract test checks that the response has no unexpected keys.
- **API keys.** `bb_live_…` / `bb_test_…`, shown once, stored as a SHA-256 hash with a visible prefix. Staging and production use separate databases, so their keys are separate by construction. The prefix is a readability check only.
- **Rate limit.** A fixed one-minute window in Postgres (`api_rate_windows`). Upstash and Cloudflare are deliberately not used: the volume is three to four consumers, and Neon is already a dependency. Responses carry `RateLimit-*` headers and `429` with `Retry-After`.
- **Caching.** `Cache-Control: private, max-age=300` plus a weak `ETag`, and `304` on a matching `If-None-Match`.
- **OpenAPI.** Generated from the same Zod schemas the route validates its output against (`z.toJSONSchema`), written to `public/openapi.json` by `pnpm api:spec`, and checked in CI so the document can't drift from the code.
- **Freshness/gone setting.** `GONE_AFTER_DAYS` env var, default 7, read in one place (`lib/settings`). It doesn't need to be a database setting until someone other than us has to change it.
- **Invitations.** Our own `invitations` table (email, farm, role, Clerk invitation ID, invited by, invited at, accepted at). When someone signs in for the first time, `getSessionUser` matches their verified Clerk email to an open invitation and creates their `users` row. This means onboarding needs no webhook.

## Testing Decisions

- Vitest, following the existing pattern: pure functions tested directly (status mapping, key hashing, rate-window maths, activity-log assembly), and storage tested at the module boundary.
- Each ticket's *Done when* is written so it can be checked by a test or a single scripted request.
- The API contract test validates a real handler response against the generated OpenAPI schema.

## Out of Scope

SMS and phone calls, Cloudflare, Google and Facebook sign-in, automated signup or profile sync with the co-op app or Dataverse, directory data (photos, KYF badge) on the farm stand, market and hours info, subscription tiers, exposing quantities or prices, and write access through the API.

## Milestones

| By | Tickets | Why then |
|---|---|---|
| **Sat Nov 14** | 31, 34 | Every other ticket depends on the schema, and Gabrielle needs the contract first |
| **Sun Nov 15** | 32, 33, 37, 38, 44 | Pilot farms are invited and can sign in, post, and have a stand before Monday. Usage tracking runs from their first message |
| **Tue Nov 17** | 35, 36, 43 | API on staging with Gabrielle's key, which gives her two days before launch |
| **Wed Nov 18** | 39, 40, 42 | Debugging tools ready for launch day. The decision on "gone" should be made by now |
| **Thu Nov 19** | 41, then production keys | Editing a farm is a stretch goal. Until then, use `db:studio` |

## Tickets

| # | Title | Blocked by |
|---|---|---|
| 31 | Farm record fields and posted-by attribution | — |
| 32 | Role enforcement audit and tests | 31 |
| 33 | Farm stand for every KYF-verified farm | 31 |
| 34 | API contract and generated OpenAPI spec | — |
| 35 | Read API: bulk and single-farm endpoints | 31, 34, 36 |
| 36 | API keys, revocation and rate limiting | 31 |
| 37 | Admin: add a farm and invite its people | 31 |
| 38 | Admin: sign-ups | 37 |
| 39 | Admin: inventory view | 32 |
| 40 | Admin: activity log | 31 |
| 41 | Admin: edit a farm | 31 |
| 42 | Gone after N days (API) | 35 |
| 43 | Staging environment and seeded farms | 35, 36 |
| 44 | Dedicated LLM key and per-message usage | 31 |
