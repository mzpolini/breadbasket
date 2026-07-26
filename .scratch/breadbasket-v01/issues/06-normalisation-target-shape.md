# The normalisation target shape

Type: grilling
Status: open
Audience: us
Blocked by: 02

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
