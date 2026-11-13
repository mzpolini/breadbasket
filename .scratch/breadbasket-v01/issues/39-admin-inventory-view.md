# Admin: inventory view

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 32
Parent: 30 · Brief item 4.3

## What exists

`requireFarmAccess` already lets admins open `/farm/[farmId]/stock` (the farmer's full inventory, with quantities and attention flags) and `/farm/[farmId]/preview` (the farm stand). The admin farm list links to `/farm/[id]`. Most of this item is already there.

## What to build

- On the farm detail page, add links to **Stock**, **Stand preview** and **API view**.
- **API view** renders exactly what `apiItems` (35) reports for the farm, statuses included, so an admin can see what the directory map sees. Until 35 lands, show stock and preview only.
- In the farm list, show each farm's last-spoken time and its count of in-season items, so a farm that has gone quiet stands out.

## Done when

From `/admin`, an admin reaches any farm's current inventory, as the farmer sees it and as the directory sees it, in one click.
