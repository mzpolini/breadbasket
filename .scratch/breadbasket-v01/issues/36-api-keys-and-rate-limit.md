# API keys, revocation and rate limiting

Type: spec
Status: done
Audience: us
Blocked by: 31
Parent: 30 · Brief item 3

## What to build

**Table `api_keys`:** `id`, `name` (e.g. "MABFC directory: production"), `prefix` (first 12 characters, shown in the admin page), `key_hash` (SHA-256 hex, unique), `created_by`, `created_at`, `last_used_at`, `revoked_at`.

**Key format:** `bb_live_<32 random base62>` on production, `bb_test_…` elsewhere. Choose the prefix from `VERCEL_ENV`. Staging and production have separate databases, so a staging key can't authenticate against production.

**`lib/api/keys.ts`:**

- `issueKey(name, adminId)` returns the plaintext once.
- `revokeKey(id)`.
- `authenticateApiKey(req)` returns `{ ok, keyId } | { ok: false, status: 401 | 403 }`. A missing or unknown key gets 401, a revoked key gets 403. It updates `last_used_at` at most once a minute.

**Rate limit:**

- Table `api_rate_windows (key_id, window_start, count)`, primary key `(key_id, window_start)`.
- A single upsert-and-return: `INSERT … ON CONFLICT DO UPDATE SET count = count + 1 RETURNING count`.
- Limit 60 per minute per key, configurable with `API_RATE_LIMIT_PER_MIN`.
- Over the limit, return `429` with `Retry-After`.
- Always send `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`.
- Old windows are cleaned up lazily, deleting rows older than an hour on roughly 1% of requests.

**Admin UI:** a small "API keys" section on `/admin`. List keys with prefix, name, last used and status. Add a button to issue a key, which shows the plaintext once with a copy button. Add a button to revoke a key. The issue/revoke flow is how a key gets rotated.

**Script:** `pnpm api:key <name>` for issuing a key from the CLI on staging before the admin UI exists.

## Done when

- A request with an issued key succeeds.
- The same key gets 403 after revocation, and a newly issued key works.
- The 61st request in a minute gets 429 with the right headers.
- Unit tests cover hashing, the 401 vs 403 split, and the window maths.

## Outcome

- `api_keys` and `api_rate_windows` tables (in `scripts/migrate-pilot-beta.ts` too). Only a SHA-256 hash is stored; the plaintext is shown once.
- `lib/api/key-format.ts` (pure: key shape, hashing, bearer parsing, window maths), `lib/api/keys.ts` (`issueKey`, `revokeKey`, `authenticateApiKey`), `lib/api/rate-limit.ts` (one upsert-and-return, lazy sweep).
- 401 for missing, malformed or unknown; 403 for revoked. `last_used_at` is written at most once a minute, decided in the `WHERE`.
- Admin: an "API keys" section on `/admin` with issue (plaintext once, copy button) and revoke. `pnpm api:key "<name>"` from the CLI.
- Settings in one place now, `lib/settings.ts`: `API_RATE_LIMIT_PER_MIN`, `GONE_AFTER_DAYS`, `FRESHNESS_DAYS`.
- The 61st request in a minute gets 429 with `Retry-After`; a rejected request still counts, so a client hammering past the limit stays past it.

Tests: `lib/api/key-format.test.ts`, `lib/api/keys.test.ts`, and the admin actions in `lib/auth/roles.test.ts`.

**Verified against the real database (Nov 13, local dev server):** migration applied; no key → 401; unknown key → 401; issued key → 200 with `Cache-Control`, `ETag`, `RateLimit-*`; a temporary mapped farm with movements and a rule came back with the right statuses and dates and no leaked phrase or user id; `If-None-Match` → 304; `farm_ids` filter and the 400; exactly 60 requests allowed in a minute, then 429 with `Retry-After`; the key revoked → 403. The temporary farm and its rows were deleted; the test key remains in `api_keys`, revoked. Not yet checked: a deployed URL (`breadbasket-theta.vercel.app`).
