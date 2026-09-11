# Removals that remove, and a ledger that only holds what he approved

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: —

## Problem Statement

A farmer tried to take okra off his farm stand and couldn't.

He said "remove okra", corrected the read-back from sold out to "deer ate them", approved it, and was told his okra showed none left. His stand and his stock list both kept showing it. Because the removal carried no number — which is how the sentence is spoken — the ledger read it as a claim that he still had okra and had just confirmed it, so the crop came back **fresher than before**. The read-back said one thing and the record did another, which is the single failure this product exists to prevent.

Three more faults sit behind that one:

- A read-back he had **corrected and never approved** was published into his record nine times, on its own, a minute after the conversation moved on. The same signature appears earlier in the data at five. Nothing he tapped, nothing he said yes to.
- The **Sold out** button does not take anything off the stand. It writes a true-up to zero in an invented unit, which collides with the unit he actually speaks in, and a position counted two ways is published as available.
- On the stand, **flagged** positions sort above live ones, so the greyed block sits at the top of his page.

His live record is currently wrong in a way he cannot fix by talking to the app.

## Solution

Saying a crop is gone makes it gone, on every surface, whether or not he ever gave it a number. Saying *why* it went is recorded — deer and weather are ordinary on a farm, not a kind of spoilage. And nothing reaches his record that he did not approve, enforced by the store rather than by the client behaving.

- A **movement** that reduces a **position** and carries no amount empties it. A position can now be **none left**, and none-left positions appear on no surface.
- A partial reduction requires a figure; the agent asks for one or records a true-up instead. Every read-back for a reduction states the resulting balance rather than the change, so what he approves is the outcome.
- Every reduction carries a **loss reason**: sold, spoiled, wildlife, pests, weather, donated, own use. Kept alongside his own sentence, shown only to him.
- A **read-back** can be published at most once, and only the newest one is publishable — a card he has corrected is dead.
- The rows he never approved are deleted; everything he did say is corrected forward.
- On the stand, available sorts above flagged.

## User Stories

1. As a farmer, I want "deer ate them" to take the crop off my page, so that a customer doesn't drive out for okra that isn't there.
2. As a farmer, I want to say a crop is gone without giving a number, so that I'm not interrogated for a figure I don't have.
3. As a farmer, I want a removal of part of my stock to need a number, so that "I sold some" never wipes the lot.
4. As a farmer, I want the read-back to show me what I'll be left with, so that I can catch a removal that means more than I intended before it's published.
5. As a farmer, I want a crop I emptied to disappear from my stock list too, so that the list matches what I just said.
6. As a farmer, I want to be able to add a crop back after emptying it, so that "the deer got them, but I picked more on Friday" works in one conversation.
7. As a farmer, I want the reason a crop went recorded in my own words, so that my record reads like something I said.
8. As a farmer, I want wildlife, pests and weather kept apart from spoilage, so that my record doesn't claim food rotted when a deer ate it standing.
9. As a farmer, when I lose a crop to wildlife or weather, I want to be asked once whether more is coming, so that a standing harvest rule doesn't keep advertising a crop that's gone.
10. As a farmer, I want the "Sold out" button to actually take the crop off my page, so that the one button for the job does the job.
11. As a farmer, I want pressing "Sold out" not to leave the crop flagged as counted two ways, so that I'm not sent to fix arithmetic I never got wrong.
12. As a farmer, I want a crop I've said is gone to leave my page even if I'd previously counted it two ways, so that a unit muddle doesn't trap a crop on the stand.
13. As a farmer, I want nothing published that I haven't approved, so that my record only ever contains claims I made.
14. As a farmer, I want a read-back I've corrected to be dead, so that a later "yes" lands on what I'm looking at and not on something I changed my mind about.
15. As a farmer, I want reloading the app or switching to my page and back to publish nothing, so that moving around the app is never a write.
16. As a farmer, I want the same card published twice to write once, so that a flaky connection doesn't double my stock.
17. As a farmer, I want the nine okra rows I never approved removed from my record, so that my history doesn't claim I said something I didn't.
18. As a customer, I want a crop the farmer has emptied to be absent from the stand, so that what's listed is actually available.
19. As a customer, I want what's available listed above what's gone stale, so that the first thing I read is the thing I can actually buy.
20. As a customer, I want the reason a crop went to stay private, so that the stand stays a list of what I can buy rather than a farm diary.
21. As the founder, I want a season's loss reasons recorded honestly, so that what deer, weather and pests cost a farm is answerable later without a migration.
22. As a developer, I want a position's emptiness to be a state the fold returns, so that no surface has to infer "gone" from a quantity of zero and a unit that may not exist.
23. As a developer, I want the publish decision to be a pure function, so that the rule about which read-back may be published is testable without a browser.
24. As a developer, I want the store to reject a second publish of the same read-back, so that the promise holds regardless of what any client does.

## Implementation Decisions

### The fold — a position can be none left

- `MovementKind` collapses to `add | remove | trueup`. The presence-refresh rule — a movement with no amount asserts presence, refreshes confirmation and leaves the figure alone — applies to `add` and `trueup` **only**.
- A reduction with no amount sets the position to zero and marks it cleared. The fold gains a fourth outcome alongside known, present and unit-conflict: **none**. A none position carries the same freshness fields as any other, because he did speak — it simply appears on no surface.
- Cleared is not sticky. Any later movement with an amount, or any later `add`/`trueup`, un-clears it, so "deer got them, picked more Friday" folds to what he picked rather than to a sum with a ghost.
- The none outcome is decided **before** the unit test, so a position he says is gone leaves the stand even if its movements disagree on units. This is the only way a unit conflict can currently be escaped without an explicit true-up.
- A `trueup` of zero keeps folding to a known zero. Projections already withhold that; nothing changes for it.

### Loss reason

- A movement gains an optional **loss reason**, drawn from a closed set: `sold | spoiled | wildlife | pests | weather | donated | own-use | other`. It is meaningful on a reduction and ignored elsewhere.
- The reason is orthogonal to the kind: it never changes the arithmetic, only the record. His own sentence continues to be kept verbatim as the raw phrase, and `other` plus his words is a valid outcome when nothing in the set fits.
- Storage gains a nullable reason column. The reader tolerates the legacy `spoil` kind and folds it as a reduction with reason `spoiled`, so a stray old row can never fail to load. The one legacy row in the live data is backfilled.
- The agent's proposed-movement schema loses `spoil` from its kind enum and gains the reason. The read-back shows the reason in his words.

### What the agent is told

- A reduction with no number means all of it. Never propose an amountless reduction for a partial — ask for the figure, or record a true-up.
- Every read-back for a reduction states the resulting balance, not the change.
- Wildlife, weather and pests prompt exactly one line about what comes next, because a crop eaten in the field usually means the planting is gone rather than the crate. "Sold out" prompts nothing — more is obviously coming.
- Nothing here gives the agent a path to the ledger. It proposes; he publishes.

### The publish relay

- The decision of which publish signal may be honoured moves out of the chat component and into the pending module as a pure function: given the transcript, the set of signals already acted on, and which message is the live turn, it returns at most one read-back to publish.
- Only a signal in the **newest** assistant message is honourable. A signal restored from the transcript on reload is never actionable — that is the defect that wrote nine rows.
- Only the **newest** read-back is publishable. An older, uncommitted read-back is dead: he corrected it, and no later yes may land on it.

### The store

- Publishing a read-back becomes idempotent per proposal, guarded by the database rather than the client. A published-proposal record keyed on farm and proposal id is written in the same transaction as the batch; a second attempt fails on the key and writes nothing.
- Uniqueness must **not** be placed on the movement rows themselves: one read-back legitimately writes several movements under one proposal id, so a unique index on farm and proposal id would reject the rest of a valid batch.
- Movements remain append-only for everything the farmer said.

### Surfaces

- None-left positions are withheld from the farm stand and from the farmer's own stock list. Withholding from his own view is deliberate: this is his own claim being honoured, not a timer hiding food. Flag-don't-delete governs silence, not statements.
- The stand sorts available before flagged, and within each group most recently spoken first. The farmer's stock list keeps its existing order — what needs him first — because it answers a different question.
- The Sold out button writes an amountless reduction with reason `sold`. It stops inventing a unit, which is what was producing the unit conflict.

### The live data

- A one-off, re-runnable cleanup deletes movements written without an approval, identified by proposal id: the nine okra rows whose read-back was superseded and never approved, and the four duplicate persimmon rows beyond the single approved write. Nothing else is ever deleted (ADR 0003).
- The script reports what it would delete before deleting, and is safe to run twice.

## Testing Decisions

A good test here states what a farmer said and asserts what a surface shows. It never reaches for the shape of the fold's internals, never asserts on a private helper, and never mocks a module the assertion depends on. Every test in this repo is pure: movements in, view models out.

Prior art to follow exactly:

- `lib/ledger/ledger.test.ts` — the `movement()` builder with a partial override, and the narrowing helper that throws when the balance isn't the status a test is about. Add a matching helper for the none outcome.
- `lib/projections/projections.test.ts` — the `inventory()` helper that folds and projects in one call, so a test reads as "he said this, his page shows that".
- `lib/agent/commit.test.ts` — conversion tests that assert the farmer's words survive the trip.
- `lib/agent/pending.test.ts` — the existing home for which read-back a yes means; the relay rule joins it.
- `lib/storage/movements.test.ts` — pure round-trip mapping, no database.

What gets tested, by seam:

- **Ledger** — an amountless reduction empties a position that had a figure; empties one that never had a figure; a later add un-clears it; a reduction with a figure still subtracts; none beats a unit conflict; a reduction refreshes confirmation like any other claim; a legacy `spoil` row folds as a reduction.
- **Projections** — none is absent from the stand, from the public listing and from the farmer's stock list; available sorts above flagged; a flagged position is still shown rather than hidden; forecast behaviour is unchanged.
- **Commit** — a loss reason survives the conversion; a reduction with no amount stays amountless rather than acquiring a unit; the sold-out path produces an amountless reduction with reason sold.
- **Pending** — a signal in the newest assistant message publishes the newest read-back; a signal restored from history publishes nothing; an older uncommitted read-back is never the target; a signal already acted on is not acted on twice.
- **Storage** — round-trip of the reason column, including null and the legacy kind.

The proposal-uniqueness guard cannot be covered by the existing suite: there is no database harness, and adding one is not in this spec. It is verified once by running the cleanup and a second publish against the development database, and the result recorded in the spec's closing comment.

The parser eval should be re-run after the tool schema changes, since the kind enum the model writes against is different.

## Out of Scope

- **Crops and varieties** — spec 29. The tomato fragmentation and the four bell peppers are untouched here.
- **Reminders and nudges.** The stale page remains the only prompt to check in; FOUNDER 2 is open and the channel is the founder's call.
- **Crop-loss reporting as a feature.** This spec records the reasons; it builds no report. FOUNDER 7 is open.
- **Per-crop freshness windows.** Still a flat seven days.
- **A database test harness**, and any component-level testing infrastructure.
- **An undo for a crop emptied by mistake.** He re-adds it in conversation, which already works.

## Further Notes

- ADR 0002 records the removal rule and the alternatives rejected; ADR 0003 records why rows the farmer never approved are deleted rather than compensated. Both are accepted and should be respected rather than revisited in the implementation.
- Vocabulary for this work is in `CONTEXT.md`: movement, position, read-back, published, flagged, freshness window, none left, loss reason.
- Two founder callouts stay open and should not be pre-empted: whether "no number means all of it" matches how farmers speak (FOUNDER 6), and whether documented crop loss is worth holding (FOUNDER 7).
- Order within this spec: the fold and the surfaces first, then the relay and the store guard, then the cleanup. The farmer's live page is wrong until the cleanup runs, so it should not be left to last by accident.

## Closing notes

Shipped in `169d438`, plus review fixes.

**Verified against the development database**, as the testing decisions require: publishing a read-back once returns true and a second attempt returns false; the cleanup deleted thirteen rows — nine from the read-back he corrected, four duplicate persimmon writes from the same defect in an earlier session — and his okra now reads as none left on both surfaces, with the stale block sorted below what is available.

**One requirement landed only in part.** "Every read-back for a reduction states the resulting balance rather than the delta" holds where a reduction empties a position: the card reads *none left*. A reduction with a figure still reads as the figure he said — the card is built from the proposed movement alone and does not know the position it applies to, so stating an outcome would mean threading current balances into the chat and risking a stale one. The safety-critical half, where he gives no number and means all of it, is covered. The rest is an open call, recorded here rather than quietly narrowed in ADR 0002.
