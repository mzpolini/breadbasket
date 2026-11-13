# Staging environment and seeded farms

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 35, 36
Parent: 30 · Brief item 6

## What to build

**Environment:** a Vercel custom environment (or a long-lived preview branch) named `staging`, with:

- A separate Neon branch for its database.
- Its own Clerk development instance.
- Its own `PUBLIC_BASE_URL`.

Production data never reaches staging.

**Seed script `pnpm db:seed-staging`:** idempotent, safe to re-run. Upserts four test farms with **fixed, hard-coded IDs** that Gabrielle can map to her dev records:

| farm_id | slug | state |
|---|---|---|
| `farm_stg_alpha` | `staging-alpha` | verified + mapped, everything in season |
| `farm_stg_bravo` | `staging-bravo` | verified + mapped, a mix of all three statuses |
| `farm_stg_charlie` | `staging-charlie` | verified + mapped, only coming soon (harvest rules) |
| `farm_stg_delta` | `staging-delta` | verified, **not mapped**, so it should never appear in the API |

Use placeholder `directory_profile_id`s until Gabrielle sends real dev profile IDs, then hard-code hers. Generate movements relative to now, as `lib/seed` does, so the statuses stay current.

**Key:** issue `bb_test_…` for Gabrielle with `pnpm api:key "MABFC directory: staging"`. Hand it over through a password manager or another secure channel, never by email or chat.

## Done when

- Gabrielle can call the staging bulk endpoint with her key and get alpha, bravo and charlie with stable IDs.
- Re-running the seed doesn't change any farm ID.
