# API keys, revocation and rate limiting

Type: spec
Status: ready-for-agent
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
