# Crops, with varieties under them

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 28

## Problem Statement

A farmer said he had heirloom tomatoes, then named German Johnson and Brandywine. He said bell peppers, then green, red, yellow and orange. The system heard six unrelated crops.

That costs him three ways. His **farm stand** lists four bell pepper entries where a customer has one question. His weekly **check-in** made him enumerate all four colours to say the peppers were fine. And when he asked to rename two crops so they read as heirloom tomatoes, the app created two more products rather than renaming, so the farm now carries five tomato products for two plants, all ageing separately.

When he told the app outright that German Johnson and Brandywine are varieties of heirloom tomatoes, it kept the sentence as a note about the farm and changed nothing.

## Solution

A claim is about a **crop** and, where he named one, a **variety**. Varieties are learned only from what he says — there is still no canonical produce list and no setup step. A customer sees one line per crop with the varieties named beneath it. Speaking about a crop refreshes everything under it. A quantity given at crop level stays there and is never split across varieties. Renaming is a **merge**: two names taught to mean one thing, folding their claims together, with nothing in the ledger rewritten.

## User Stories

1. As a farmer, I want to say "heirloom tomatoes" and then name the varieties, so that I can talk the way I talk to a customer.
2. As a farmer, I want "the peppers are still good" to cover all four colours, so that a check-in is a sentence and not a roll call.
3. As a farmer, I want a quantity I give for a crop to stay at crop level, so that a figure I told you was combined isn't split into guesses.
4. As a farmer, I want to give a figure for one variety alone, so that "about ten pounds of Brandywine" is recordable.
5. As a farmer, I want renaming a crop to fold its history in, so that correcting a name doesn't leave a duplicate ageing on my page.
6. As a farmer, I want the five tomato entries this already created merged back into two, so that my record stops lying about what I grow.
7. As a farmer, I want a new variety word to be treated as a variety of a crop I already have, rather than a new crop, so that naming a variety doesn't fragment my stand.
8. As a farmer, I want to be asked once when it isn't clear whether a word is a variety or a crop, so that a guess doesn't quietly fragment my page.
9. As a farmer, I want my stock list grouped by crop with varieties under it, so that I see two tomatoes rather than five.
10. As a farmer, I want a parent figure and variety figures never summed, so that my stock list doesn't invent tomatoes I don't have.
11. As a customer, I want one line per crop, so that "have they got bell peppers?" is answered once.
12. As a customer, I want the varieties named under the crop, so that I know a German Johnson is what I'd be driving out for.
13. As a customer, I want a stale variety greyed within its crop line, so that a fresh sibling doesn't vouch for something the farmer hasn't mentioned in a fortnight.
14. As a customer, I want a crop with no named varieties to look exactly as it does today, so that nothing gets more complicated for a farm that doesn't work this way.
15. As the founder, I want varieties learned from the farmer rather than from a produce taxonomy, so that the stand keeps reading in his words.
16. As a developer, I want the crop-and-variety pair to be what a position is keyed on, so that no surface has to parse a product string to know what it's looking at.

## Implementation Decisions

- A movement's product becomes a **crop** plus an optional **variety**. A position is keyed on the pair. A claim naming only the crop is its own position, distinct from any variety's.
- **Freshness rolls up; quantity does not.** A crop-level claim refreshes the confirmation clock of every variety position under it, because "the peppers are fine" is a true statement about all of them. A crop-level amount stays on the crop position and is never distributed.
- The farm stand renders one entry per crop: the crop name, its varieties named beneath, and one availability line. A variety whose own last claim is outside the **freshness window** is greyed within that line, so the crop line never vouches for a variety that has gone stale. A crop is absent from the stand only when the crop position and every variety under it are absent.
- The farmer's stock list groups by crop: the crop's own figure on the heading, variety figures shown only where a variety has one. Parent and child figures are never summed.
- Varieties are learned the way vocabulary already is — from what he says, per farm, newest wins. A sentence like "German Johnson and Brandywine are the varieties of heirloom tomatoes" teaches the mapping rather than becoming a note about the farm. The agent asks one short question when a new word might be either a variety or a crop.
- A **merge** teaches that two crop names mean one thing. It is applied when folding, so both names' movements land in one position; the ledger is not rewritten and no movement is deleted. Merging is how a rename is honoured.
- The existing fragmentation is repaired by merges, not by editing history: the German Johnson and Brandywine products fold under heirloom tomatoes as varieties, and the duplicates created by the rename fold into them.

## Testing Decisions

The same rule as spec 28: state what he said, assert what a surface shows. Prior art is `lib/projections/projections.test.ts` for the surfaces, `lib/vocabulary/vocabulary.test.ts` for what the farm has been taught, and `lib/ledger/ledger.test.ts` for how positions are keyed.

- **Ledger** — a crop-level claim and a variety claim are separate positions; a crop-level claim refreshes the varieties under it; a crop-level amount does not reach them; merged names fold into one position.
- **Projections** — one stand entry per crop with varieties named; a stale variety greys inside a fresh crop line; a crop with no varieties renders as it does today; a crop is withheld only when everything under it is; the stock list groups by crop and never sums parent with child.
- **Vocabulary** — a taught variety resolves to its crop; a merge resolves two crop names to one; newest teaching wins.
- **Commit** — a proposed movement carrying a variety survives conversion.

## Out of Scope

- A seeded produce taxonomy, and any setup step for crops.
- Varieties of varieties. One level only.
- Quantities distributed across varieties, in either direction.
- Anything in spec 28, which this depends on and which ships first.

## Further Notes

- Vocabulary is in `CONTEXT.md`: crop, variety, merge. ADR 0002 and 0003 constrain the ledger this sits on.
- The stand's promise is unchanged: availability only, never quantities.
- This is a week's work, not a day's, and it should not ride along with spec 28 — that one is dangerous while broken, this one is only awkward.
