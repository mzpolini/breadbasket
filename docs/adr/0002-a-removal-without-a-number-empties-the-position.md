# 2. A removal without a number empties the position

Date: 2026-09-11

## Status

Accepted

## Context

A movement may carry no amount. That was decided for presence: "I've got collards" is a complete claim, and the fold treats an amountless movement as asserting presence — it refreshes the confirmation clock and leaves the figure alone.

The second beta pointed that rule at a removal. The farmer said "remove okra", then "deer ate them". Both arrived with no number, because that is how the sentence is spoken. The ledger read them as *he still has okra, and has just confirmed it*: the figure stood at 10 lb and the crop became the freshest thing on his public page. The read-back had already told him "none left", so the card and the ledger disagreed — the one failure this product exists to prevent.

Most of the farm's positions have no number at all, so subtracting was not available as a fix: there was nothing to subtract from.

## Decision

Presence-refresh applies to `add` and `trueup` only. **A removal with no amount empties the position.** A folded position is now one of three things: a figure, *some* with no figure, or **none left** — and "none left" is reachable whether or not a number was ever given.

A partial removal requires a figure. The agent asks for one, or records a true-up instead; it never proposes an amountless removal for "I sold some". Every read-back for a reduction states the **resulting** balance rather than the delta, so what he approves is the outcome.

## Considered options

- **Reject amountless removals at the commit boundary.** Safest, and turns the most natural sentence a farmer speaks into an error.
- **Forbid it in the prompt only.** Leaves the ledger able to record a removal that removes nothing, and makes the promise depend on the model behaving.

## Consequences

- "Sold out" stops being a true-up to zero in an invented unit, which was silently producing a unit conflict — and a unit conflict still publishes as available, so our own button was leaving sold-out crops on the page.
- The risk moves to one place: a farmer who means "some of it" and gives no number. The read-back is where that gets caught, which is why it now shows the outcome.
- **Flagged** is untouched. Silence still means stale, never gone; only something he said empties a position.
