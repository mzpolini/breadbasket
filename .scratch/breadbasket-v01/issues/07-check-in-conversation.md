# The check-in conversation in real words

Type: prototype
Status: open
Audience: us
Blocked by: 06

## Question

What does the agent actually say? Not the flow diagram — the words.

Write the real exchanges, then react to them:

- The **check-in**: how the agent opens, and how it avoids feeling like a form.
- The **read-back**: how it reflects what it heard so the founder can catch errors fast. What does it do with items it is unsure about?
- The **confirmation**: what "publish" looks like when there is a screen rather than "reply YES".
- The **expiry nudge**: "still got those collards?" — one nudge, ever. What does it say and how does it accept a one-word answer?
- **Correction**: the founder says the read-back is wrong. How does he fix one line without redoing the lot?
- **Omission** is no longer a problem to solve in words: [The availability record shape](01-availability-record-shape.md) made silence mean *no movement*, so the balance simply stands. Nothing to ask about.
- **Deltas vs true-ups.** The model now distinguishes "I sold about half" from "I weighed it, 50.6." Does the agent ever need to ask which he means, or is it always inferable? Mishearing a delta as an absolute silently corrupts the balance, so this is the highest-stakes ambiguity in the whole conversation.
- **The lapse nudge** (merged from [When freshness runs shorter than the rhythm](15-freshness-shorter-than-rhythm.md)). An item's freshness window closes mid-week. Does it get its own "still got those collards?" before disappearing, or does it just go quietly? The structural version of this problem dissolved with the ledger — he can send a movement any time — so what's left is purely a question of words and restraint.
- **The stocktake prompt.** When estimate debt crosses its threshold, the agent asks him to go weigh something. That is a *third* proactive message alongside the weekly check-in and the expiry nudge — which strains the north star's "one check-in and one nudge, ever". How does it earn its place without becoming the spam that makes him stop replying?

## Approach

Use `/prototype`. Cheap and concrete beats abstract — a runnable chat stub or even a written transcript is enough to react to. Link the artifact from this ticket.

## Why it matters

Principle 4 is "minutes, not sessions". If this reads as a chore on paper, it will be a chore in the truck.
