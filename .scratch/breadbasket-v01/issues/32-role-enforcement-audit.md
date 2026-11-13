# Role enforcement audit and tests

Type: spec
Status: done (pending: make the admins)
Audience: us
Blocked by: 31
Parent: 30 · Brief item 2

## What exists

`users.role` (`admin` | `farmer`), and in `lib/auth/current-user.ts`: `requireAdmin`, `requireFarmAccess` and `checkFarmAccess`. `app/admin/layout.tsx` gates the admin page. `proxy.ts` requires sign-in everywhere except `/f/*`, sign-in and sign-up.

Roles live in our `users` table, not in Clerk metadata. Keep it that way for the beta. The table is already the source of truth, and an admin can change a role without touching Clerk.

## What to build

- **Audit every server action and route handler.** Server actions aren't covered by the proxy, so each one must call `requireFarmAccess(farmId)` or `requireAdmin()` itself before doing anything. Specifically:
  - Every export in `app/farm/[farmId]/actions.ts` and `app/admin/_actions.ts`.
  - `app/api/chat/route.ts`.
  - Any new route added by 35–41.
- Allow the `/api/v1/*` paths (API-key auth, 36) in `proxy.ts` as public to Clerk.
- **Make the admins:**
  - Run `scripts/make-admin.ts` for Thelonious, Gabrielle and Matt once they have accounts, or invite them as admins through 37.
  - Record the three emails in an env var or a runbook note. Don't put them in code.
- **Pending users:** someone signed in with no invitation and no farm keeps landing on `/onboarding`.
- **Tests:** Vitest with `getSessionUser` mocked, covering:
  - A farmer is refused another farm's page data, actions and chat.
  - A farmer is refused `/admin` and every admin action.
  - An admin is allowed all of the above.

## Done when

A farmer can't reach the admin page or another farm's data, and an admin can reach all of it. The tests prove both.

## Outcome

**Audit findings, all fixed:**

- Every Server Action and `/api/chat` already checked for itself. The gaps were the *pages*: `/farm/[farmId]` (chat, stock, preview) and `/admin` were protected only by their layout, which doesn't re-render between pages. Each page now calls `requireFarmAccess` / `requireAdmin` itself.
- `/api/chat` let an admin through with no `farmId` at all; it now answers 400.
- `requireAdmin` now returns the admin, so writes (37) can say who did them.
- `/api/v1/*` is public to Clerk in `proxy.ts`; those handlers authenticate an API key (36).

**Tests:** `lib/auth/roles.test.ts` runs the real session logic and proves a refused caller *writes nothing* (farmer vs another farm's page, actions and chat; farmer vs `/admin` and every admin action; admin allowed everything; pending and signed-out). `lib/auth/doors.test.ts` reads the source and fails for any Server Action, route handler or protected page that doesn't check, so tickets 35–41 can't forget. Handlers under `app/api/v1/` may satisfy it with `authenticateApiKey(` (36).

**Still for a human:** make the three admins (invite them as admins through 37, or `scripts/make-admin.ts` for the first one) and keep the list outside the repo. The steps are in `BOOTSTRAP.md`.
