# BreadBasket v0.1 — design brief

For claude.design. Everything here is derived from decisions already made and code already written — the state inventory in particular comes from the ledger, not from imagination. A designer would never guess `unit-conflict` exists, and it does.

Companion documents: [the conversation transcripts](prototypes/conversation-draft-1.md) for wording, [the PRD](spec.md) for scope, [the map](map.md) for why anything is the way it is.

---

## What this is

A farmer tells an agent what he has, in his own words. The agent reads back what it heard; nothing publishes until he confirms. Everything published expires, so what a buyer sees is either true or absent.

**Who is using it in v0.1:** exactly one person — the founder, on his own farm, on a phone, outdoors, possibly one-handed, possibly on bad signal.

**What it has to beat:** his paper notebook, which he uses to get ready for Saturday's farmers market. The notebook is fast, offline, works in a truck, needs no login, and never misunderstands him. Anything we do worse than that has to be paid for by something it cannot do at all.

**Tone:** he is telling a neighbour what he's got. Not filling in a form. The whole weekly exchange should take under two minutes.

---

## Three surfaces, in priority order

| | Surface | Who for | Why it matters |
|---|---|---|---|
| 1 | **Chat + read-back** | Farmer | Where the product actually happens. Contains the one component no library ships. |
| 2 | **His own inventory view** | Farmer | What pilot success is measured on — it has to beat the notebook for market prep. |
| 3 | **Public availability page** | Buyers (none yet) | Keep it plain. No buyer uses it during the pilot; it exists so the freshness promise is checkable. |

Spend the effort on 1 and 2.

---

## The shared vocabulary — every state a position can be in

This is the part worth reading twice. A position is derived from a ledger of movements, and it can come out in any of these shapes. **All of them need a visual treatment.**

### Quantity states

| State | Means | Example |
|---|---|---|
| **known** | A figure and a unit | `40 lb` · `20 bunches` |
| **present** | He has some, never said how many. Completely valid — "I've got collards" is ordinary speech and we refuse to interrogate him for a number | `available` |
| **unit-conflict** | He said pounds, then boxes. Same crop counted two ways, no conversion, **so there is no honest number to show**. Must not render as a quantity | needs its own treatment |
| **negative** | Sold more than he had, meaning a movement is missing. Deliberately not clamped to zero — hiding it would hide the error | `-10 lb` |

### Confidence states — annotation, never hiding

| State | Means |
|---|---|
| **weighed** | He measured it. Say so — it's a trust signal, not a footnote |
| **estimated** | A guess. The default: a bare "50 pounds" is an estimate unless he says he weighed it |
| **estimated · not weighed in 3 weeks** | **Degrades over time as guesses stack up.** This is load-bearing, see below |

### Liveness — hides, never annotates

| State | Means |
|---|---|
| **live** | Inside its freshness window. Showable |
| **lapsed** | Window closed. **Absent from the public page entirely** — not greyed, not struck through, gone. But he should still see it in his own view, or he can't tell the difference between "sold out" and "you forgot" |
| **forecast** | A claim about a *future* window — "about 30lb ready next week". Must never look like current stock |

**The two signals do different jobs and must not be conflated.** Expiry governs whether something is shown at all. Confidence only ever annotates. A degrading annotation never hides anything.

### Why the degrading annotation is load-bearing

It is not decoration. It's the mechanism that gets him to weigh things.

Rather than nagging him with a third notification, the cost of not weighing shows up where he can see it: his public page slowly reading less trustworthy to the buyers he wants. So `estimated` → `estimated · not weighed in 3 weeks` needs to feel like **a page getting less confident**, not like an error or a scold.

---

## Surface 1 — the chat and the read-back

### The exchange

```
AGENT   Evening. Last week you had collards, tomatoes and squash.
        What's changed?

FARMER  squash is done. collards maybe 20 bunches, tomatoes about 40lb
```

The opening names **crops but never numbers**. Naming crops lifts the recall burden; showing him last week's figure is a suggestion he might lazily agree with, and a rubber-stamped stale number is indistinguishable from a fresh one once published. **No prior quantity appears anywhere, including in the read-back.**

### The read-back — the component that matters

This is the thing no component library ships, and it is the centre of the product.

```
┌─────────────────────────────────────────┐
│  Collard greens    20 bunches           │
│  total · estimated              [edit]  │
├─────────────────────────────────────────┤
│  Tomatoes          40 lb                │
│  total · estimated              [edit]  │
├─────────────────────────────────────────┤
│  Summer squash     none left            │
│  sold out                       [edit]  │
└─────────────────────────────────────────┘

Publish this?          [ Publish ]  [ Fix something ]
```

**The word `total` is the most important thing on the line, and the reason is not obvious.** The agent has to infer whether "I've got 50 pounds" means *my total is 50* or *50 more arrived*. It assumes total. When that assumption is wrong it **silently discards stock** — and the read-back is the only place that gets caught. So:

- The **kind** (`total` / `added` / `sold` / `spoiled`) reads before the confidence.
- `[edit]`'s **first offer is flipping the kind**, not editing the number.
- Correcting one line must never mean redoing the lot.

On a correction, show **both the movement and the resulting total** — he says one and means the other:

```
┌─────────────────────────────────────────┐
│  Tomatoes          40 lb  added         │
│  90 lb total · estimated        [edit]  │
└─────────────────────────────────────────┘
```

### Rows you must design for

- A presence-only row: `Collard greens · available · total · no amount`
- A unit-conflict row: he said pounds then boxes, and there is no number to print
- A sold-out row
- A forecast row for a future window, sitting alongside current stock without being mistaken for it

### The founder's view of the machinery

He is technical and wants to see the agent's tool calls rendered as a flow rather than as JSON. **This is a verbosity dial on the same surface, not a separate admin panel** — he sees the read-back plus the extraction and resolution steps that produced it. Failures are the most informative moments: an empty parse, an unresolved product, a retry. Design those, don't hide them.

---

## Surface 2 — his own inventory view

Competing directly with a notebook, for the job of *getting ready for Saturday*.

Needs to answer at a glance:

- What have I got, per crop
- What's about to lapse — sell it or re-confirm it
- Which numbers are guesses stacked on guesses, i.e. what to put on the scale
- What's forecast for next week, alongside what's here now

Open questions worth exploring visually: is it a list, a checklist, or something you could read one-handed in a barn? Can he edit here, or only in the conversation? A notebook is directly editable, and if this view is read-only he may resent it — but two ways to change inventory must agree.

---

## Surface 3 — the public availability page

One farm, known location, no discovery, no distance, no buyer actions. Read-only.

```
Collard greens
~25 lb · estimated · confirmed 2 days ago

Tomatoes
50.6 lb · weighed · confirmed today
```

- Lapsed items are **absent**, not greyed
- `estimated` must not read as *unreliable* — it reads as *honest*
- An empty state that reads **trustworthy rather than broken** — "nothing listed this week" is the system working correctly, not a failure

---

## Constraints

- **Mobile first, genuinely.** A phone, outdoors, glare, one hand, possibly dirty. Not "responsive desktop".
- **Bad signal is normal.** The notebook always works.
- **No login.** One farm behind one secret URL — nothing to remember, nothing to type.
- **Under two minutes** for the weekly exchange, start to publish.
- Next.js 16 / React 19 / Tailwind 4. Copy-in components strongly preferred over installed dependencies for anything this central.

---

## Do not design

Buyer accounts, search, discovery, distance or "near me", ordering, payments, delivery, reviews, ratings, photos, farmer dashboards with charts, multi-farm anything, onboarding wizards or setup flows. **There is no onboarding** — the first conversation is the onboarding, and the read-back is how the agent learns his vocabulary.

---

## Known-open, and useful to have opinions on

- **"Publish this?" is our word, not a farm word.** *Put it up? Post it?* Going to the founder, but a designer's instinct is welcome.
- Whether the inventory view is editable or read-only.
- How a lapsed item should read in **his** view, where it must be visible, versus the public page where it is absent.
- Whether `estimated · not weighed in 3 weeks` can carry its message without reading as an error state.
