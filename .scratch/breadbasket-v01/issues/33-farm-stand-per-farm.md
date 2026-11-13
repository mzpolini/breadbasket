# Farm stand for every KYF-verified farm

Type: spec
Status: done
Audience: us
Blocked by: 31
Parent: 30 · Decision: "Only KYF-verified farms get a farm stand page"

## Problem

`app/f/[farm]/page.tsx` returns 404 for anything except `seed-farm`. `AvailabilityCard` defaults its `farmId` to `'seed-farm'`, and `FarmHeader` reads the hard-coded `SEED_FARM` profile. As things stand, a pilot farm has no public page.

## What to build

- `/f/[slug]`: look up the farm by slug. Return 404 unless the farm exists and `kyf_verified = true`. Render `<AvailabilityCard farmId={farm.id} />`.
- Remove the `'seed-farm'` default from `AvailabilityCard`, and make `farmId` required.
- `FarmHeader` takes the farm row (name, tagline, market, logo) instead of `SEED_FARM`.
- The farmer's preview at `/farm/[farmId]/preview` renders whether or not the farm is verified, so a farmer can see their page before it goes public. It shows a "not public yet" note while unverified.
- Don't show directory data (photos, KYF badge) on the stand. That's out of scope.

## Done when

- A verified pilot farm's stand renders at `/f/<slug>` with its own name and inventory.
- An unverified farm returns 404 publicly, but its farmer can still preview it.

## Outcome

- `/f/[slug]` looks the farm up by slug; a missing or unverified farm is the same 404, so the public can't tell them apart. It does not resolve by farm ID.
- `AvailabilityCard` takes the farm (no `seed-farm` default) and `FarmHeader` takes the row. The card takes the whole farm row rather than a bare `farmId`, so it doesn't look the farm up twice.
- The farmer's preview renders whether or not the farm is verified, with a "not public yet" note until it is.
- Beyond the ticket: `FarmNav` also hard-coded the seed farm's name, so every pilot farm's shell would have said "Mighty Thundercloud". It now takes the farm's name from the layout.
- Commits revalidated `/f/<farmId>`, which isn't a URL any more; the stand is dynamic, so it now revalidates the `/f/[farm]` pattern.

Tests: `lib/farms/stand.test.ts`.
