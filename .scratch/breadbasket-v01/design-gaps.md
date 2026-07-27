# Design came back — what it settles, what it breaks, what's missing

Source: **Inventory UI prototype variations** (`b40ebf8e-7e31-4216-8bf3-ca8aa7890a85`), two turns — the three surfaces (`1a`–`1h`) and the machinery view (`2a`–`2c`). Design system: **Organic**.

Read against the [design brief](design-brief.md), the [map](map.md), and what is actually built in `lib/`.

---

## It hit the brief

Every state in the brief's inventory got a treatment, including the ones I warned a designer would never guess at:

| Brief said | Design did |
|---|---|
| Kind reads before confidence | `1b` — "kind-first ledger line", and `1c` explicitly rejected for making the kind chip quieter |
| Presence-only is a real claim | "available · total · no amount, **and that's fine**" |
| Unit conflict has no honest number | "no total · Counted two ways. Boxes don't convert to dozens" |
| Negative is not clamped | "−10 lb · **a pick is missing, not a mistake**" |
| Forecast must not look like stock | Sage, with a rule down the left edge — "never enters the black-ink column" |
| Lapsed absent from public, visible to him | `1g` omits them; `1d` has a LAPSED section |
| Degrading annotation must not read as an error | "same ink as everything else — no red, no icon. It reads as the page getting quieter about itself" |
| Empty state reads trustworthy, not broken | "Rather than show you last week's list, this page shows you nothing — **that's the deal**" |
| Machinery is a verbosity dial, not an admin panel | `2a` — three notches, same bubbles, same words. "No JSON, no ids, no 200 OK" |
| Failures get designed | `1h` — all four, and empty parse "never says I didn't understand" |

**It also answered a founder question for us.** The publish button is **"Put it up"** and the question is **"Sound right?"** — with the note that both are ours to overrule. That was routed to the founder; it can come off the digest unless he objects.

---

## Direct conflicts with what is built

### 1. Freshness: flat 7 days vs per-product — **needs a decision**

Design decided **7 days for everything**, reasoned as a market week: *"Published Saturday, lapses the following Saturday — so lapsed always means you haven't talked to me since last market."*

We built **per-product freshness** (`freshnessByProduct`), on the reasoning that salad greens go in three days and winter squash sits for two months, so one window is wrong in both directions.

Both are defensible and they are not compatible:

- **Flat** is explainable in one sentence, matches the notebook's rhythm, and makes "lapsed" mean exactly one thing.
- **Per-product** is more honest about the food and is what the founder's freshness answer was going to feed.

The code supports both — flat is just an empty `freshnessByProduct`. **This is arguably the founder's call**, and it should go to him with the design's argument attached, because the design's reasoning is better than mine was.

### 2. `1b` vs `1c` — the designer left this open and flagged the trade-off

`1c` (quantity-forward) "reads faster at arm's length, but the kind chip is quieter — and kind is the thing that silently loses stock." That is an argument against `1c` in its own caption. **Recommend `1b`.**

### 3. Surface 2 has three directions and needs one

`1d` read-only sorted by what needs doing · `1e` Saturday loading checklist · `1f` one-crop-one-card for the barn. Designer's instinct: *"1f for the barn, 1d for honesty."* Unresolved.

---

## Missing from the code — real gaps, roughly by size

### Offline and queued movements — **the biggest one**

The design has a full offline story: *"Held on your phone."* · *"No signal out here. It goes up by itself the moment you have bars."* · *"held 81 min"* · *"Written while you had no signal — went up at 8:31am when you hit the road."*

We have **nothing**. No queue, no local persistence, no sync, no `queued` state on a movement.

This matters more than it looks: **the notebook always works**, and that was named as the incumbent's strongest advantage. An app that fails in a field with no bars loses to paper on the one axis that was always going to decide it. The design treats bad signal as *the normal case*, which is right.

### Pending questions as durable work items

*"You never answered — the 8 bags are still not in the book."* · *"Answer it now"* · *"Sort it out"*

The design models an **unanswered question that persists across sessions** and shows up as work. We have no such concept — no question record, no way for an exchange to end unresolved and be picked up on Tuesday.

This is what makes `2c` more than a log. It is also the thing that stops an unresolvable unit conflict from being silently forgotten.

### Sessions and exchanges

`2c` groups by exchange — *"6 exchanges this market week"*, each with a duration, a slow-reply note, a movement count. Movements carry a `sessionId` but nothing models a session, an exchange, its timing, or its outcome.

### Market day as the organising event

Everything in the design anchors on it: *"market in 2 days"*, *"Loading for Saturday"*, *"at the market Saturdays, 8–1"*, and the freshness argument itself. We have no concept of a market day.

Worth noting this is exactly the **"demand event"** framing from the windowless-stock decision — the designer arrived at it independently, which is a good sign it is real.

### Farm profile

*"Mighty Thundercloud Edible Forest · Maryland · at the market Saturdays, 8–1"* plus a logo. We have `farmId` and nothing else. Small, but the public page cannot render without it.

### Unit-conflict resolution, including "Both"

Design offers **"4 boxes / 5 dozen / Both, they're different"**. That third option says a crop can legitimately carry two units as separate positions — corn sold by the box *and* by the dozen. Our model treats any divergence as a conflict with no resolution path.

So we need: a way to resolve a conflict by picking a unit (converting or discarding the other), **and** a way to say the two are genuinely separate positions.

### Smaller

- **Time remaining before lapse** — "5 days left", "Comes down Sat 2 Aug on its own". We have `expiresAt`; only the formatting is missing.
- **A one-tap re-confirm** — "Still true" writes a confirmation movement. Our presence-only true-up already does exactly this; it just needs the affordance.
- **Direct edits as movements** — `1e`'s stepper writes "sold 2 bunches" rather than overwriting. Consistent with the ledger; nothing to change, but it constrains how the editable views are built.
- **Voice** — drawn but inert, correctly marked as next release.

---

## Nothing in the design contradicts the domain model

Worth saying plainly. The ledger, the derived balance, kind-before-confidence, expiry hiding versus confidence annotating, presence-only, negatives preserved, forecasts separated — the design assumes all of it and pushes on none of it. The `2b` diff view is the ledger rendered honestly: *"Every total above is worked out from the lines, never stored."*

The one place it goes further than we did is **refusing to total rather than refusing to record** — *"Your 4 boxes are safe in the book. I just can't add them to dozens."* That is what we built. Good.

---

## What I would do next, in order

1. **Decide `1b`** and one Surface 2 direction. Both are yours; neither needs the founder.
2. **Take the freshness question to the founder** with the design's market-week argument, since it is better than the one I gave him.
3. **Implement `1b` and `1g`** against the Organic tokens — the read-back row and the public page are fully specified and need no further decisions.
4. **Ticket the offline story.** It is the largest gap and it is load-bearing against the notebook.
5. **Ticket pending questions.** Smaller, but it is what makes the trace useful and stops conflicts being forgotten.
