# Gone after N days (API)

Type: spec
Status: done (option A, in place until Thelonious says otherwise)
Audience: founder
Blocked by: 35
Parent: 30 · Brief item 5

## Decision needed (Thelonious)

The brief says to mark an item gone after N days without an update. Today's product rule (CONTEXT.md, *Flagged*) says silence never removes anything from the farm stand: a stale item stays there, greyed with its age, as the farmer's reminder to check in.

- **A (proposed, and built by default):** `gone` after N days applies to the **API / directory map only**. The farm stand keeps showing flagged items as stale. A map pin needs a yes or no, while the farmer's own page works as a reminder.
- **B:** `gone` after N days on both. Simpler to explain, but stale items disappear without a trace, and the stand stops prompting the farmer to check in.

## What to build (option A)

- `lib/settings.ts` exports `goneAfterDays()`: `GONE_AFTER_DAYS` env var, default 7, validated as a positive integer. It's the only place the number is read.
- `apiItems` (35) uses it.
- The existing freshness window (`FRESHNESS_DAYS` in `lib/seed`) stays as the stand's flagging rule. Move it into `lib/settings` too, so both numbers live in one place, and say in a comment that they're independent.
- "An item is gone when the farmer says so" already works: a removal with no amount empties the position to *none left* (ADR 0002). The API reports it as `gone` right away.

If B is chosen, also hide flagged items older than N days in `standListings`, and update CONTEXT.md's *Flagged* entry.

## Done when

- An item silent for N days reads `gone` in the API.
- Changing `GONE_AFTER_DAYS` changes when that happens, with no code change.
- An item the farmer said is gone reads `gone` immediately.

## Outcome

Built as the proposal (option A), as agreed. `lib/settings.ts` exports `goneAfterDays()` (`GONE_AFTER_DAYS`, default 7, positive integers only, anything else falls back) and now holds `FRESHNESS_DAYS` too, with a comment that the two are independent. `apiItems` uses it. Silence turns an item `gone` at exactly N days; *none left* is `gone` immediately; `gone` items are dropped 14 days later. The stand is unchanged.

Decided with the owner that this stays Option A; what Thelonious and Gabrielle are told is in [pilot-beta-handoff.md](../pilot-beta-handoff.md), to be delivered after implementation. If he picks B, hide flagged items older than N days in `standListings` and update CONTEXT.md's *Flagged* entry; the API contract doesn't change. CONTEXT.md now defines *Gone* and *Mapped farm*.

Tests: `lib/settings.test.ts`, and the status and boundary cases in `lib/projections/api.test.ts`.
