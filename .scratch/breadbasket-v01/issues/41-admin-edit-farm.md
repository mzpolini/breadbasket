# Admin: edit a farm

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 31
Parent: 30 · Brief item 4.5 (stretch)

## What to build

An edit form on the farm detail page for name, slug, tagline, market, logo URL, MABFC directory profile ID and KYF-verified.

- The farm ID is shown read-only with a copy button. It never changes.
- Changing the slug warns that the old farm stand URL will stop working.
- Turning off KYF-verified warns that the farm will disappear from the stand and the API.
- Uniqueness errors on the slug and the directory profile ID show inline.

Until this ships, use `pnpm db:studio`.

## Done when

An admin can change a farm's info and KYF status without the database studio.
