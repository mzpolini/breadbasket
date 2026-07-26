# For the founder — BreadBasket v0.1

Generated from open tickets with `Audience: founder` on the [v0.1 map](map.md). Regenerate whenever the map moves; this file is a snapshot, not the source of truth.

**Context to give him first.** v0.1 is a chat web app, not SMS — text and voice come later. The pilot is just him and his farm. Availability works as a full picture he confirms each week, where each item stays live for as long as that item stays true. His Sunday 7pm / Monday 7am schedule is taken as settled, and the forecasting idea is being built into the data model now, though the two-column display ships in v0.2 alongside buyers.

**All of this fits in one sitting.** Items 1–3 are the same conversation — get him talking about a real week and most of it answers itself. Item 4 waits until he has used the thing.

---

## 1. Record a few weeks of him saying what he has

*(from [Collect how the founder actually says it](issues/17-collect-real-utterances.md) — the single highest-leverage thing he can give us)*

Voice memos, not typed notes. A transcript loses the hesitations and self-corrections, and the audio itself becomes the seed of a speech-recognition test set when voice arrives.

Ask him to talk as if a regular customer had just asked what he has — not as if filling in a form. Useful to capture across a few weeks, ideally including one busy week and one lean one:

- Hedged amounts — "maybe 30 lbs", "a good amount", "nearly out"
- Several products in one breath
- Negations — "no more squash"
- Future-dated claims — "done with tomatoes til next month"
- His own units — "a mess of", flats, bushels

Everything downstream — how the agent understands him, what it says back, how we test it — is guesswork until this exists.

## 2. How do you say how much you have?

*(from [Units and quantity](issues/02-units-and-quantity.md) — blocks the agent's ability to understand him at all)*

A bunch of carrots, a head of lettuce, tomatoes by the pound. There is no single unit that fits produce, and we would rather learn his than invent one.

- Which things does he think of by weight, which by count, which by bunch or box?
- How often is it genuinely not a number?
- Would a buyer be satisfied knowing he *has* something, or do they need how much?

## 3. How long does each thing stay true?

*(from [Freshness windows](issues/03-freshness-windows-and-rhythm.md) — sets when we hide things)*

We would rather show less than lie, so everything listed expires. We need to know how fast.

- How long after he tells us would he still expect it to be there? Greens versus squash, say.
- Does that change by season for the same crop?
- Sensible shelf life per crop, or ask him each time?
- Does Sunday 7pm hold year-round, or should it move in peak season?

**Worth raising:** if greens only stay true three days but he confirms weekly, they are false for half the week. Does he want a mid-week nudge on fast movers, or is the weekly confirmation better understood as "what I expect to have this week" rather than "what is in the barn right now"?

## 4. What the availability states mean in real farming

*(from [What the availability states mean to a farmer](issues/24-availability-semantics-founder.md) — push him on these; he is technical enough to think structurally, and a wrong answer here is a schema migration later)*

These encode how farming actually works. A developer can't reason their way to them — get them wrong and the system is internally consistent and wrong about the world.

- **Omission.** He sends a new week's picture and doesn't mention tomatoes. Sold out, forgot, or unchanged? Lapsing them silently risks hiding real food; carrying them forward risks lying. Should the agent ask — and does asking every week become the friction we're trying to remove?
- **What actually happens to produce.** Available to gone in one step, or is there a "nearly out" a buyer cares about? Does anything come *back* — a second picking, a field that recovers?
- **Withdrawal vs sold out.** Is "take this down" a different thing from "I sold out"? Both hide the listing; only one is about the farm rather than the crop.
- **"100 confirmed, 200 unconfirmed."** 300 total, or a 200 forecast of which 100 are now confirmed? If he forecast 200 and confirms 100, is the other 100 still unconfirmed or superseded?
- **How wrong is too wrong?** System says 50lbs, there are 40 — has it lied? What size of error makes a buyer stop trusting it? This sets how precise quantity has to be, which is otherwise an arbitrary engineering choice.

## 5. What's your word for putting it up?

*(from [The check-in conversation](issues/07-check-in-conversation.md) — ten seconds, and unguessable from here)*

After the agent reads back what it heard, there's a button. We've drafted it as **"Publish this?"** — but *publish* is our word, not a farm word.

- What would he say? *Put it up? Post it? Send it? Make it live?*
- And when something sells out — *take it down? pull it?*

## 6. What would make this worth continuing — and what would make you drop it?

*(from [What convinces us this works at n=1](issues/12-n-of-1-success.md) — hold this until he has used a working check-in)*

- After a few weeks, what would make him say this is worth keeping up?
- What would make him stop?
- Is the honest test just whether he keeps doing it without being reminded?
- How long should we run before deciding either way?
