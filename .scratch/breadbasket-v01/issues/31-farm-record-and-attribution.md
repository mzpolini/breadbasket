# Farm record fields and posted-by attribution

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: —
Parent: 30 · Brief item 1

## What to build

Inventory is already per farm. This ticket adds the farm fields the directory needs, and records which person made each write.

**Schema (`lib/db/schema.ts`):** all changes are additive. Apply with `pnpm db:push`.

- `farms.slug text unique not null`: the farm stand URL segment. Backfill `slug = id` for existing rows.
- `farms.directory_profile_id text unique null`: the MABFC directory profile ID.
- `farms.kyf_verified boolean not null default false`.
- `posted_by text null` on `movements`, `harvest_rules`, `notes` and `messages`. It holds the Clerk user ID. `null` means the row was written before attribution existed.
- Index `messages (farm_id, posted_by, seq)` for the activity log.

**Code:**

- `createFarm` generates `farm_<nanoid(10)>` IDs and takes a slug. Update the comment in `lib/storage/farms.ts`: the ID is the immutable Breadbasket farm ID, and it is not a slug.
- Add a `farmStandUrl(farm)` helper that returns `${PUBLIC_BASE_URL}/f/${farm.slug}`. Read `PUBLIC_BASE_URL` from an env var.
- Thread the session user's ID into every writer:
  - `app/api/chat/route.ts` sets it on saved messages, both the user turn and the assistant turn it triggered.
  - `commitProposed`, `commitRules` and `markSoldOut` in `app/farm/[farmId]/actions.ts`, plus `lib/agent/commit.ts` (through `CommitContext`), set it on movements and rules.
  - Note writes set it too.
- Take the user ID from `getSessionUser()` on the server, never from the request body.
- Admin writes made while an admin acts on a farm record the admin's ID. This is intended.

## Done when

- Two farmer users assigned to the same farm each post an update, and both see one shared inventory on `/farm/<id>/stock`. Each resulting movement carries its author's `posted_by`. Cover this with a storage-level test.
- Existing data still renders unchanged. `seed-farm` has `slug = 'seed-farm'`.
