# Admin: add a farm and invite its people

Type: spec
Status: ready-for-agent
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
