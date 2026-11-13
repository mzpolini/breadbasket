# Pilot beta: what to expect, for Thelonious and Gabrielle

> **Before you send this** (delete this box first)
>
> - Written to be true once the read API is deployed. Check the dev URL below answers before sending it.
> - Gabrielle needs a key. Issue one from the admin page (or `pnpm api:key "MABFC directory: staging"`) and send it separately, not in this doc.
> - The seed farm is not KYF-verified, so its stand returns 404 and it is not in the API. Verify it (and give it a directory profile ID if it should be on the map) before Thursday.

---

## For Thelonious: one decision, already made for you

**What "gone" means on the directory map.**

You asked for an item to be marked gone after 7 days without an update. The farm stand works the other way on purpose: silence never removes anything there. A stale item stays on the page, greyed, with how long it's been, so the stale page is the farmer's reminder to check in.

Both can't be true on the same surface, so we gave them to two different ones:

| | Farm stand (customers) | Directory map (the API) |
|---|---|---|
| Not mentioned for 7 days | Stays, greyed, "not confirmed in 8 days" | Reported as **gone** |
| Farmer says "none left" | Removed | Reported as **gone** straight away |
| Gone items | n/a | Kept in the response for 14 more days so the map can take its pin down, then dropped |

**Why:** a map is used to decide whether to drive somewhere. A greyed tomato means nothing on a pin; it's either there or it isn't. The stand is where the farmer is nudged.

**What this buys and costs.** The stand keeps working as a reminder, and the map stays honest. The cost is that the two surfaces can disagree for a few days: a farm quiet for nine days still shows the item on its stand, greyed, while the map says it's gone. That is the intended behaviour.

**The alternative (B):** apply "gone after 7 days" to the stand too. Simpler to explain, but a farmer who gets busy would find their page quietly emptied, with nothing to tell them or customers why, and the stand would stop prompting anyone to check in.

**We built A**, because it's the reversible choice: switching to B is a small change to the stand and nothing in the API contract moves. **If you'd rather have B, say so and we'll change it.**

The 7 is a setting, not a rule. It changes with no code change (`GONE_AFTER_DAYS`).

**One more thing to know:** a standing harvest rule ("twenty pounds of watermelon every week through September") is *not* made gone by silence. It shows as coming soon until its end date or until the farmer ends it. A farmer says it once and shouldn't have to repeat it weekly.

---

## For Gabrielle: how the availability API behaves

Contract: `/openapi.json` (the same document the API is tested against).

**Base URL (development):** `https://breadbasket-theta.vercel.app/api/v1`. Staging and production URLs to follow.

**Auth.** `Authorization: Bearer <key>`. Development and staging keys start `bb_test_`, production `bb_live_`. Keys don't work across environments. No key or an unknown key is `401`; a revoked key is `403`. If you lose a key or leak one, ask for a new one and we'll revoke the old one.

**Two calls**

- `GET /farms/availability`: every mapped farm in one call. This is the one the map should load. Optional `farm_ids=a,b,c` (at most 100) to narrow it; IDs that don't exist or aren't mapped are left out, not reported as errors.
- `GET /farms/{farm_id}/availability`: one farm. `404` for a farm that doesn't exist and for one that isn't mapped, with the same answer, so the API doesn't reveal which farms exist.

**Try it.** Replace `<your key>` with the key we send you (it starts `bb_`).

```bash
# Every participating farm, in one call. This is the one the map should use.
curl -H "Authorization: Bearer <your key>" \
  https://breadbasket-theta.vercel.app/api/v1/farms/availability

# One farm. Mighty Thundercloud is the first real farm.
curl -H "Authorization: Bearer <your key>" \
  https://breadbasket-theta.vercel.app/api/v1/farms/seed-farm/availability
```

Today's response for Mighty Thundercloud (`farm_id` `seed-farm`), trimmed:

```json
{
  "farm_id": "seed-farm",
  "directory_profile_id": "mabfc-pending-mighty-thundercloud",
  "farm_stand_url": "https://breadbasket-theta.vercel.app/f/seed-farm",
  "last_updated": "2026-09-29T18:44:50.780Z",
  "items": [
    {
      "product": "beets", "variety": null, "status": "coming_soon",
      "last_updated": "2026-09-15T23:49:22.608Z",
      "expected_from": null, "available_until": "2026-11-30",
      "quantity": null, "unit": null, "price": null
    }
  ]
}
```

Two things to know about it:

- **`directory_profile_id` is a placeholder** (`mabfc-pending-mighty-thundercloud`) until we have the farm's real MABFC ID. Don't join on it yet. `farm_id` is the stable one.
- **It's thin, and that's honest.** The farmer hasn't updated since Sept 29, so everything he had on hand is long past gone and no longer reported. It fills in the moment he checks in again. The response is a true picture, not a bug.

**A demo farm to map against.** `demo-profile-1` (`farm_id` `farm_demofarm001`, "Demo Farm (sample data)") is not a real farm. It exists so you can see every status at once: items in season, coming soon (with and without dates), and gone (both because the farmer said so and because the silence ran out). Ignore it, or filter it out by that profile ID, once real farms are flowing. We'll remove it before launch.

**Which farms appear.** KYF-verified *and* given your directory profile ID. Your profile ID is echoed back as `directory_profile_id`, and `farm_id` never changes, so it's safe to store and join on.

**Statuses**

- `in_season`: the farm has it now and has mentioned it within the last 7 days.
- `coming_soon`: the farm expects it. `expected_from` / `available_until` are set when the farm gave dates, otherwise `null`. A "coming soon" with no dates that the farm hasn't repeated for 7 days drops out; one with dates stays until its window ends.
- `gone`: the farm said none left, or hasn't mentioned it for 7 days. **Kept in the response for 14 days after it goes**, then dropped. Remove the pin when you see `gone` or when the item disappears.

A crop appears once per farm, at its most useful status.

**Fields that are always `null` during the beta:** `variety`, `quantity`, `unit`, `price`. They're in the contract now so filling them in later won't break you.

**Caching.** Responses can be cached for 5 minutes (`Cache-Control: private, max-age=300`). Send the `ETag` back as `If-None-Match` to get `304` with no body when nothing changed. `last_updated` is when the farm last said anything; `generated_at` on the bulk response changes every call and doesn't affect the `ETag`.

**Rate limit.** 60 requests a minute per key. Every response carries `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`; over the limit you get `429` with `Retry-After`. One bulk call per refresh is far inside this.

**Public data only.** No emails, phone numbers, or anything a farmer said word for word.
