# Admin: sign-ups

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 37
Parent: 30 · Brief item 4.2

## What to build

A "People" table on `/admin`, also filtered per farm on the farm detail page. One row per invitation or user:

- Email, farm, role.
- Invited at and invited by.
- Status: *invited*, *accepted*, *revoked*, or *signed in without invitation* (that last one is a pending user, to be assigned or ignored).
- First sign-in: when the `users` row was created.
- Last sign-in: Clerk `lastSignInAt`. Fetch it in one `clerkClient().users.getUserList({ userId: [...] })` call per page render, not one call per user.
- Last posted: the latest `messages.created_at` where `posted_by` is this user.

This replaces the current "Pending Users" section. The assign-to-farm action stays available for pending rows.

## Done when

An admin can see who has been invited, who has logged in, and when, for every pilot farm.
