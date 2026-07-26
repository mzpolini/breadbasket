# The normalisation target shape

Type: grilling
Status: resolved
Audience: us
Blocked by: —

## Answer

The agent emits **movements** (shape in [The availability record shape](01-availability-record-shape.md)). Three inference defaults settle the hard parts, all chosen so the safe failure is *under*-claiming rather than over-claiming.

### 1. Kind: absolute by default

"I've got 50 pounds of tomatoes" is a **`trueup`** — his total is now 50. An `add` requires explicit increment language: *more, another, picked, harvested, extra*. `remove` and `spoil` are unambiguous in practice (sold, gave away, lost, rotted).

Two reasons. A farmer saying "I've got X" is stating a position, not reporting a transaction — he is telling you what is in the barn. And systemically it keeps drift low: every casual statement of stock *resets* the balance instead of compounding onto it, so estimate debt only grows through events he explicitly reports. Delta-by-default has the opposite property and the number rots faster.

**Accepted cost:** an `add` phrased loosely reads as a reset, silently discarding stock. The mitigation is not in the parser — see the read-back requirement below.

### 2. Measured: false by default

`measured` flips true only on a signal of measurement — *weighed, counted, on the scale*, or a non-round figure like 50.6. A bare "50 pounds" is an **estimate**.

This keeps the estimate-debt mechanism alive: if bare numbers counted as measured, debt would rarely accrue, the stocktake prompt would never fire, and the compounding-drift safeguard would be decorative. Being wrongly nudged to weigh something is a mild annoyance; publishing a remembered figure as a measurement is the failure this product exists to prevent.

### 3. Quantity is optional — presence-only movements exist

"I've got collards" is a valid movement with **no `amount`**. It publishes as *available* with no figure, is unmeasured by definition, accrues estimate debt, and earns a stocktake prompt in time — so the system drifts toward numbers without ever demanding one. Forcing a number would interrogate him on the most natural sentence in the language.

**This requires a ledger change:** `amount` becomes optional on `Movement`, and the fold, both projections, and both views must handle a position that is live and has no number. Not yet implemented — the ledger as committed requires `amount`.

### Falling out of the above

- **The read-back must surface the `kind` prominently and make it one tap to flip.** This is the mitigation for the absolute-by-default cost, and it is a hard requirement on [The chat surface design](20-chat-surface-design.md) rather than a nicety.
- **The clarifying-question budget is reserved.** Because everything above is guess-and-show-in-the-read-back, the agent should essentially never ask. Reserve the one permitted question for genuine non-comprehension and for a detected unit conflict, where no honest number is computable.
- **Unknown products simply become products**, named as he said them, confirmed like anything else. Vocabulary accretes; there is no taxonomy to admit them to.

### Left open, deliberately small

Unlearning: if he corrects the same mapping twice in opposing directions, which wins. Not worth deciding before it happens with real transcripts.

> **Unblocked from [Units and quantity](02-units-and-quantity.md).** That ticket was treated as a prerequisite, and it is not one. `Unit` is a bare string and vocabulary accretes conversationally, so **units accrete exactly as products do** — the agent learns "bushel" the first time he says it. What genuinely needs the founder is unit *conversion* (deferred: we surface unit conflicts rather than converting) and the precision threshold (already a parameter). His answer tunes the parser; it does not shape it.

## The target is now known in outline

[The availability record shape](01-availability-record-shape.md) settled that the agent emits **movements**, not items. So the extraction target is a flat movement: `kind` (add / remove / spoil / trueup), `amount`, `unit`, `measured`, `window`, `state`, plus the normalised product and the raw phrase as said.

That makes this ticket narrower and harder than it was. The agent must now infer **which kind of movement** an utterance is — "I sold about half" is a `remove` with `measured: false`; "I weighed it, 50.6" is a `trueup` with `measured: true`; "30 more ready next week" is an `add` in `forecast` state on a later window. Getting the *kind* wrong is worse than getting the quantity wrong, because a delta applied as an absolute silently corrupts the balance.

## Vocabulary accretes conversationally — no onboarding gate

Settled in direction: the set of known products is **learned in the course of normal conversation**, not seeded by a setup form. There is no onboarding step. The farmer starts talking; the agent learns his words as he uses them.

The mechanism is already in the loop — **the read-back is the onboarding.** The agent normalises optimistically, shows its interpretation in the read-back it was going to show anyway ("collard greens, 3 bushels"), and a correction teaches the vocabulary. That costs **zero additional questions**, which matters because the north star allows at most one short clarifying question and a farm has dozens of terms. A design that asks about each unknown term would spend the entire first conversation interrogating him.

What remains open here:

- **When to guess versus ask.** Optimistic normalisation is right most of the time, but "greens" mapping to the wrong greens is a lie the read-back may not make obvious. Where is the confidence line, and is asking ever better than guessing-and-showing?
- **What "learned" means concretely.** A farm-scoped term-to-product mapping that accretes from corrections and confirmations — and does an unconfirmed guess teach anything, or only an explicit correction?
- **Does a term ever get unlearned?** If he corrects the same mapping twice in opposite directions, which wins.

## Question

We decided against adopting a canonical product taxonomy — the agent normalises free text instead. But it cannot normalise into nothing. What is the target?

- What is the **minimum known shape** the agent must emit per item: a normalised product name, a unit family, a quantity, a confidence?
- Where does the set of known products come from if not a taxonomy — does it accrete from what the founder says, seeded from his crop list?
- What happens to a term that maps to nothing? Held as unresolved, published as-is, or bounced back as a question?
- How much normalising is too much? "Greens" → collard greens is helpful; "greens" → the wrong greens is a lie.
- Does the agent ever ask a clarifying question, and what is the budget — the north star says at most one short one.

## Why it matters

This is the contract between the conversation and the data. Both [The check-in conversation](07-check-in-conversation.md) and [The public availability view](09-public-availability-view.md) depend on it.
