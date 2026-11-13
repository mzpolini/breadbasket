# Admin: add a farm and invite its people

Type: spec
Status: done (pending db migration, Clerk settings, prod email check)
Audience: us
Blocked by: 31
Parent: 30 · Brief item 4.1

## What to build

**Add a farm form:** name, slug, MABFC directory profile ID (optional at creation), KYF-verified checkbox, tagline, market. The ID is generated. This replaces the current create-farm form, which asks for a hand-typed ID.

**Add a person** (on a farm's admin detail page, `/admin/farms/[farmId]`):

- Fields: email and role (`farmer` by default, `admin` allowed).
- Show a required checkbox next to the email: *"Email matches this person's MABFC member record."* There is no co-op integration in the beta (no automated sync), so the admin attests to the match. Store who attested and when on the invitation.
- On submit:
  1. Insert an `invitations` row (`id`, `email` stored lowercased, `farm_id`, `role`, `clerk_invitation_id`, `invited_by`, `invited_at`, `accepted_at`, `revoked_at`).
  2. Call `clerkClient().invitations.createInvitation({ emailAddress, redirectUrl: <app>/sign-up, publicMetadata: { invitationId } })`. Clerk sends the invitation email itself.
- Add buttons to resend or revoke an invitation. Each one calls the matching Clerk API and updates the row.

**Accepting:** in `getSessionUser`, when there is no `users` row yet:

1. Fetch the Clerk user's verified primary email.
2. Find an open invitation for that email.
3. Create the `users` row with the invitation's role and farm, and set `accepted_at`.

There is no webhook to set up or keep running.

**Clerk configuration (manual, once per instance):**

- Turn on Restricted sign-up mode.
- Allow email as the only identifier.
- Turn off social connections.
- Keep a short runbook of these settings in `BOOTSTRAP.md`.

**Verify on the production Clerk instance before Sunday:** the invitation email arrives, the link works, and the user lands on their farm. If delivery fails, the admin page shows the invitation URL (`invitation.url`) so it can be sent by hand.

## Done when

An admin adds a farm, invites a person, that person accepts from the email and lands on the right farm's chat as a farmer.

## Outcome

- Add-farm form takes name, slug, directory profile ID, KYF checkbox, tagline, market; the ID is generated. Duplicate slug or profile ID is refused with a message.
- `/admin/farms/[farmId]`: people on the farm, every invitation with its state, an invite form with the required MABFC attestation (who and when are stored), and **Resend** / **Revoke**. An open invitation shows Clerk's link for sending by hand.
- Clerk can't re-send an email, so *resend* revokes the old Clerk invitation and creates a new one under the same row.
- Accepting: in `getSessionUser`, a person with no `users` row (or a farmer with no farm) has their **verified** Clerk email matched to an open invitation, which creates the row. No webhook. A farmer who signed up before being invited is assigned by it. The row is written before the invitation is marked accepted, so a crash in between can't spend an invitation with nobody let in.
- If Clerk refuses to send, the invitation row is deleted rather than left looking like it's waiting.
- New `invitations` table, added to `scripts/migrate-pilot-beta.ts`.

Tests: `lib/invitations/*.test.ts`, plus the admin actions inside `lib/auth/roles.test.ts`.

**Still for a human (cannot be done from code):**

1. Run `pnpm db:migrate-pilot-beta`, then `pnpm db:push` (31 is waiting on this too).
2. Per Clerk instance: Restricted sign-up, email-only identifier, no social connections. Runbook in `BOOTSTRAP.md`. Set `PUBLIC_BASE_URL`.
3. Send an invitation to an address you own on **production** before Sunday: email arrives, link works, you land on the farm's chat. *Not verified — nothing here has been run against Clerk.*
