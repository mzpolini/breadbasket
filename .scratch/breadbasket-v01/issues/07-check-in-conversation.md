# The check-in conversation in real words

Type: prototype
Status: resolved
Audience: us
Blocked by: —

Artifact: [Conversation transcripts, draft 1](../prototypes/conversation-draft-1.md)

## Answer

The transcripts are the deliverable — read them for the actual wording. What the session settled:

### The opening names crops, never numbers

*"Evening. Last week you had collards, tomatoes and squash. What's changed?"*

Anchoring risk lives in the **numbers, not the crop names**. Naming what he grows is a memory aid and takes the recall burden off him — which is what actually beats a notebook, since the notebook is already open at last week's page. Showing him "20 bunches, was 15" is a *suggestion*, and that is how you get a stale figure rubber-stamped and published looking fresh.

So: no prior quantity appears anywhere, including the read-back. **Every number on screen came out of his mouth this evening.**

### The read-back leads with kind, then confidence

```
│  Collard greens    20 bunches           │
│  total · estimated              [edit]  │
```

`total` / `added` / `sold` / `spoiled` comes first because it is the inference that fails silently — an `add` misread as a `total` quietly discards stock, and there is no other line of defence. `[edit]`'s first offer is flipping the kind. Presence-only renders as `available` with `no amount`.

On a correction the read-back shows **both the movement and the resulting total** — he says one and means the other, and showing only the delta leaves him guessing what the world now believes.

### No verbal hedge on ambiguous kind

The `total` label carries it. Saying *"reading that as 30 total, not 30 more"* costs a sentence on nearly every line and turns the read-back back into a form — the exact thing being escaped. If the label proves insufficient in real use, that is a design fix, not a wording fix.

### The lapse nudge accepts one word

*"Still got those collards? They'll drop off the page tonight if not."* — "yeah" is a complete answer and lands as a true-up at the same figure. Silence lapses it quietly and nobody is told, because a lapse is the system working.

### The stocktake prompt becomes an incentive, not a reminder

The passive note still rides along with the check-in, but the mechanism that actually bites is **visible consequence**: as estimate debt accumulates the buyer-facing annotation degrades — `estimated` becomes `estimated · not weighed in 3 weeks`.

This is the resolution to the third-proactive-message problem. It costs no interruption, makes no demand, and puts the cost where he can see it: his page looking less trustworthy to the people he wants to sell to. A requirement on [The public availability view](09-public-availability-view.md).

### Cold start needs no setup

First contact is one open invitation. Three presence-only movements and one quantified figure is a perfectly good first publish — which is the payoff for making `amount` optional: the opening conversation is not an interrogation.

## Routed to the founder

**"Publish this?" is our word, not his.** *Put it up? Post it?* Unguessable from here, one second from him. Added to the digest.

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
