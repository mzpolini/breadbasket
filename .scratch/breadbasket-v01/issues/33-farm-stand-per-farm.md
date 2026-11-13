# Farm stand for every KYF-verified farm

Type: spec
Status: ready-for-agent
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
