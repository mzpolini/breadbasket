# Conversation transcripts — draft 1

Throwaway. Written to be argued with, not approved. For [The check-in conversation](../issues/07-check-in-conversation.md).

Everything here obeys the decisions already made: absolute-by-default, `measured: false` unless signalled, presence-only movements allowed, nothing publishes without confirmation, and the read-back shows the **kind** because that is the one inference that fails silently.

Design budget I am writing against: **under two minutes, and it should read like telling a neighbour, not filling in a form.**

---

## 1. The Sunday check-in — two variants

These are genuinely different products and the choice drives everything else.

### Variant A — open prompt

```
AGENT   Evening. What have you got this week?

FARMER  collards are good, maybe 20 bunches. still got about 40lb of
        tomatoes and the squash is done

AGENT   Got it —

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

### Variant B — anchored recap

We have a ledger, so the agent already knows what he had. It can open with the position instead of a blank page.

```
AGENT   Evening. Last week you had collards, tomatoes and squash.
        What's changed?

FARMER  squash is done. collards maybe 20 bunches, tomatoes about 40lb

AGENT   Got it —

        ┌─────────────────────────────────────────┐
        │  Collard greens    20 bunches           │
        │  total · estimated       was 15 [edit]  │
        ├─────────────────────────────────────────┤
        │  Tomatoes          40 lb                │
        │  total · estimated       was 50 [edit]  │
        ├─────────────────────────────────────────┤
        │  Summer squash     none left            │
        │  sold out                       [edit]  │
        └─────────────────────────────────────────┘

        Publish this?          [ Publish ]  [ Fix something ]
```

**The trade.** B is less work — he reacts rather than recalls, which is faster and probably beats the notebook more convincingly. But B **anchors him**, and anchoring is how you get someone confirming last week's numbers instead of telling you this week's truth. That is the exact failure this product exists to prevent, arriving through the front door with our help.

A is honest and slower. B is fast and risks a comfortable lie.

---

## 2. Anatomy of the read-back

Every line carries three things, and the order is deliberate:

```
│  Collard greens    20 bunches           │   ← what and how much
│  total · estimated              [edit]  │   ← KIND, then confidence
```

- **`total`** vs **`added`** vs **`sold`** vs **`spoiled`** — the kind, stated in plain words. This is first because it is the inference that fails silently: an `add` misread as a `total` quietly discards stock, and no other line of defence exists.
- **`estimated`** vs **`weighed`** — the confidence. Never hidden from him, and eventually never hidden from a buyer.
- **`[edit]`** — one tap, and the first thing it offers is flipping the kind.

Presence-only, when he gives no number:

```
│  Collard greens    available            │
│  total · no amount              [edit]  │
```

---

## 3. Correcting one line

He should never have to redo the lot.

```
FARMER  no the tomatoes is 40 more, i had 50 before

AGENT   ┌─────────────────────────────────────────┐
        │  Tomatoes          40 lb  added         │
        │  90 lb total · estimated        [edit]  │
        └─────────────────────────────────────────┘

        Rest unchanged. Publish?   [ Publish ]  [ Fix something ]
```

Note it shows **both** the movement and the resulting total. He said one and means the other; showing only the delta would leave him guessing at what the world now believes.

---

## 4. The ambiguity, live

This is the case the whole default exists for.

```
FARMER  got 30lb of peaches

AGENT   ┌─────────────────────────────────────────┐
        │  Peaches           30 lb                │
        │  total · estimated              [edit]  │
        └─────────────────────────────────────────┘
```

Read as a total, per the default. If he meant thirty *more*, `[edit]` flips it and the vocabulary learns nothing — but the read-back caught it, which is the whole design.

**Open:** should the agent hedge here — *"reading that as 30 total, not 30 more"* — or is the `total` label enough? Hedging in words costs a sentence every time and starts to feel like a form. My instinct is the label carries it.

---

## 5. The lapse nudge

One nudge, ever. It has to earn the interruption.

```
AGENT   Still got those collards? They'll drop off the page tonight
        if not.

FARMER  yeah still there

AGENT   Kept them up. Confirmed today.
```

A one-word reply is a full answer — "yeah" is a true-up at the same figure. If he says nothing, it lapses silently and nobody is told, because a lapse is the system working.

---

## 6. The stocktake prompt — the problem child

This is a **third** proactive message, against a north star that allows one check-in and one nudge. Attempt at making it earn its place: attach it to the check-in rather than sending it separately.

```
AGENT   Evening. What have you got this week?

        (Tomatoes have been guesses for three weeks — worth putting
        them on the scale when you get a chance.)
```

Rides along, costs no extra interruption, easy to ignore. It never blocks and never asks for a reply.

**Open:** is that enough to change behaviour, or does a note nobody must act on simply get ignored forever while the number rots?

---

## 7. Cold start

First contact. No vocabulary, no balances, nothing.

```
AGENT   This is BreadBasket. Tell me what you've got on the farm right
        now — however you'd say it to a customer. I'll show you what I
        heard before anything goes public.

FARMER  collards, mustard greens, sweet potatoes and about 200lb of
        watermelon

AGENT   Got it —

        ┌─────────────────────────────────────────┐
        │  Collard greens    available            │
        │  Mustard greens    available            │
        │  Sweet potatoes    available            │
        │  Watermelon        200 lb               │
        │  all total · estimated          [edit]  │
        └─────────────────────────────────────────┘

        Publish this?          [ Publish ]  [ Fix something ]
```

No setup, no crop list, no units configured. Three presence-only movements and one quantified — which is the payoff for making `amount` optional: the first conversation is not an interrogation.

---

## Where I am least confident

1. **Open vs anchored opening** — genuinely unresolved, and it is the biggest call here.
2. **Whether the agent should hedge on ambiguous kind** in words as well as in the label.
3. **Whether a passive stocktake note works at all.**
4. **"Publish this?"** — is that the right word to a farmer? *Publish* is our word. *Put it up? Post it?* may be his.
