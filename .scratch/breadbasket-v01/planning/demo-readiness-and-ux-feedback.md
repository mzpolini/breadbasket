# Demo readiness + Thelonius's UX feedback

Date: 2026-09-07 · Demo: Tuesday 2026-09-15 (8 days) · Status: plan, no code written

Six sections. §0 is the one that blocks everything else.

---

## §0 — "Demo ready" needs a definition, from Thelonius, this week

Yes, we can be ready. But "ready for a live demo" is not a state of the code, it
is a claim about a specific room watching a specific person do a specific thing.
Right now four people would give four answers, and the gap between them is where
a demo dies.

So the ask back to Thelonius, ASAP, is a filled-in version of this:

**Who is in the room?** Members of the co-op? Prospective farmers? Funders?
Each wants a different thing proved. Farmers want "could I use this Tuesday
night". Funders want "does this change anything".

**Who is driving?** Thelonius on his own phone with his real farm data, or one
of us on a seeded demo farm? These are completely different risk profiles. Live
on his phone is far more convincing and far more likely to break.

**What is the single sentence the room should say afterward?** If there is one
takeaway, name it — everything that doesn't serve it is cut this week.

**What is the exact script?** Minute by minute. Something like:
  1. Farmer opens the app, talks to it in plain words
  2. Agent reads it back, farmer taps to publish
  3. Farmer's public page updates live on the screen
  4. Visitor view — what a buyer sees
  5. (if we get there) the map / co-op view
Every item in that list is a thing we must make bulletproof. Anything not in the
list is explicitly not demo-blocking, and we say so out loud.

**What must NOT happen?** The failure list matters more than the feature list.
Candidates: the agent mis-hears and publishes something wrong; the page shows a
number the farmer never said; the page is empty; something takes 20 seconds.

**Live or recorded fallback?** Do we have a screen recording ready if the wifi
in the room is bad? (Strong recommendation: yes, always. It costs an hour.)

**What are we allowed to say is coming vs. done?** Being explicit here keeps
anyone from over-promising in the moment.

### Our read on what fits in 8 days

Honest scoping, given the list below:

| Item | Demo-ready by 15 Sept? |
|---|---|
| §1 wording — "What's in Season" / "Available" badge | Yes, comfortably |
| §2 Coming Soon + "Expected soon" badge + date range | Yes, comfortably |
| §3 switchel bug | Yes — but it is a model fix, not a display fix (see below) |
| Badge component system (§B) | Yes |
| §4 BFD map handshake | Our side stubbed + documented. Not a working map. |
| §5 co-op aggregate page | Only the honest version (farm counts, not totals), and only with seeded multi-farm data. See §5. |

The one thing that should worry us is §3, because it is not cosmetic and the
demo script almost certainly walks straight through it.

---

## §1 + §2 — Wording and the badge rewrite

Thelonius's asks:

1. Heading `AVAILABLE NOW` → **What's in Season**
2. Badge to the right of the crop name → **Available**; drop the "available"
   meta line underneath (it's now redundant with the badge)
3. Coming Soon items stay greyed, badge to the right → **Expected soon**
4. Keep the "expected 21 Sept – 30 Sept" line when a date is given (he loves it —
   it already works, `OneOff` in `availability-card.tsx`)

### Why this is bigger than wording

Today `availability-card.tsx` puts the same `IN SEASON` badge on *everything* —
available items, stale items, and Coming Soon rules alike. It is decoration: it
carries no state. The section heading carries the state instead.

That means the badge and the section can contradict each other, and **that is
exactly the bug in §3.** Thelonius's instinct is right and it is a correctness
fix, not a paint job: move the state into the badge, one badge per row, derived
from one function. Then a row can never say "Available" while sitting in a
section that says "Coming Soon" — the code won't allow it.

### One thing to push back on (gently)

He asked for Coming Soon items **greyed out**. But grey already means something
on this page: *stale — he hasn't confirmed this in a while*. If Coming Soon is
also grey, then a fresh "expected next week" and a 9-day-old unconfirmed
available item look identical, and we've lost the one honest signal the page has.

Proposal: Coming Soon reads **quieter, not greyer** — sage, outlined badge,
lighter weight. Grey stays reserved for age. That's close to what he's asking
for visually (it recedes) without collapsing two meanings into one colour.

Build it, put it in front of him, let him call it. He may look at it and say
grey anyway, and that's fine — but he should decide with both on screen.

### Also worth asking him

Switchel is a *made* product — a drink, produced year-round, not harvested. Does
"What's in Season" read wrong on it? Is there a separate category for
value-added goods (preserves, drinks, honey, soap), and should they carry a
different badge — "Made here", "In stock"? Not demo-blocking. Interesting.

---

## §B — Badge component system (first stab)

Right now every badge on the app is a hand-rolled `<span>`: `IN SEASON` in
`availability-card.tsx`, `counted two ways` in `stock-list.tsx`, `guessed` in
`crop-stack.tsx`. Three files, three sets of magic numbers, no shared language.
One component, one derivation function.

### The colour rule (the whole system in one line)

> **Sage = supply. Terracotta = needs you. Neutral = aged.**

Nothing else gets a colour. If a new badge doesn't fit one of those three
meanings, it's a sign we don't understand the state yet.

### Public badges (what a buyer sees)

| Badge | State | Fill | Ink | When |
|---|---|---|---|---|
| `Available` | on hand, confirmed recently | `--color-accent-2-200` | `--color-accent-2-800` | live stock |
| `Available` (muted) | on hand, not confirmed lately | none, 1px `--color-neutral-300` | `--color-neutral-700` | stale — pairs with greyed name + "not confirmed in 9 days" |
| `Expected soon` | a harvest rhythm or dated forecast | none, 1px `--color-accent-2-300` | `--color-accent-2-700` | Coming Soon |
| `Weekly` | qualifier, never alone | none, 1px `--color-neutral-300` | `--color-neutral-700` | sits *after* a state badge — this is the switchel fix (§3) |

### Farmer-only badges (his stock list, never public)

| Badge | Fill | Ink |
|---|---|---|
| `Needs weighing` | `--color-accent-200` | `--color-accent-800` |
| `Counted two ways` | `--color-accent-200` | `--color-accent-800` |
| `Below zero` | `--color-accent-200` | `--color-accent-800` |
| `Gone tomorrow` | `--color-accent-400` | `--color-accent-800` |

### Rules the component enforces

- **Exactly one state badge per row.** Enforced by the type — `state` is a
  required union, not an optional prop.
- **Qualifiers are outlined; states are filled.** So you can tell at a glance
  which one is the claim and which is the footnote.
- **Never colour alone.** Every muted/stale badge is paired with a text line
  underneath. Colour-blind readers and greyscale screenshots both survive.
- **Sentence case, not caps.** `Available` beside a 21px crop name; `AVAILABLE`
  shouts and fights the crop for attention. (Change from today's `IN SEASON`.)
- Spec: 11px, 600 weight, `.02em` tracking, pill radius, 3px/9px padding.
  Matches the existing `.meta` rhythm.

### The derivation function — the actual fix

```
badgeFor(row) → { label, tone, qualifier? }
```

One pure function in `lib/projections/`, unit-tested, consumed by every surface.
The card, the stock list, the crop stack and the BFD API all call it. That is
what makes "Available badge inside Coming Soon" structurally impossible rather
than merely fixed once.

---

## §3 — The switchel bug: root cause

He said: *"30 jars of switchel available per week"* → landed in **Coming Soon,
greyed, with an Available badge.**

Reproduced by reading, not guessed. Three separate things went wrong and stacked:

**1. The agent classified it as a rhythm, and it was right to.**
`lib/agent/instructions.ts` says any repeating phrasing ("every week", "per
week") is a *harvest rule*, not stock. So it called `proposeHarvestRules`, and
`availability-card.tsx` renders every active rule under `COMING SOON`. Working
as designed.

**2. But the sentence is both things at once, and the model has no room for that.**
The data model offers exactly two boxes: stock on hand, or a rhythm/forecast.
"I have 30 jars a week" is a *standing supply that is also available right now*.
There is no third box, so it fell in the wrong one. **This is the real bug** —
everything else is a symptom.

**3. The badge lied because badges don't know what section they're in.**
`Rule` renders `<InSeason />` just like `Listing` does. The badge said one thing,
the section said another, and nothing in the code could catch the contradiction.
Fixed by §B's single derivation function.

He also read the sage `--color-accent-2-700` Coming Soon text as "greyed out" —
worth noting for §1: that colour is not reading as intended.

### The fix

Add **recurring availability** as a first-class state: a harvest rule that also
asserts current stock. Renders under *What's in Season* with an `Available`
badge and a `Weekly` qualifier, plus his own sentence underneath. The rhythm is
still recorded — it just stops implying the jars aren't there yet.

Agent-side: when he says a rhythm **and** a present-tense availability word
("available", "I have", "on hand", "in stock", "ready now"), propose both a
movement and a rule, and read both back. When he says a rhythm about the future
("I'll have", "starting next month"), rule only — today's behaviour.

Needs: a ledger/rules change, an instructions change, a projection change, and
parser eval cases. Non-trivial, but doable in 8 days and worth doing before the
demo, because value-added goods (switchel, jam, honey, eggs) are *all* phrased
this way and Thelonius will almost certainly say a sentence like it on stage.

---

## §4 — The Black Farmer Directory map handshake

Target: visitor clicks a marker → panel shows **farm name → farmer contact →
What's in Season → bio → photos**. The "What's in Season" box slots in directly
under the contact box.

Clean division of ownership, and it should stay this clean:
**BFD owns identity, location, bio, photos. We own availability. Nobody mirrors
the other's data.**

### Two integration shapes — do both, in this order

**A. JSON API (build the stub now).** They fetch, they render in their own
components. Maximum design freedom for their map.

**B. Embeddable card (cheap follow-on).** We serve the rendered box; they drop
it in. `AvailabilityCard` is already a standalone component precisely so two
routes could share it — a third consumer is nearly free.

A is the handshake. B is the safety net: if their render drifts from our
semantics, honesty breaks on a page with our data on it. B lets them opt out of
that risk entirely.

### Contract sketch (our side of the handshake)

```
GET /api/v0/farms/{farmId}/in-season

{
  "farm":      { "id", "name", "url" },
  "updatedAt": "2026-09-07T14:02:00Z",
  "inSeason":  [ { "product": "collards",
                   "state":   "available" | "available_unconfirmed",
                   "daysSinceConfirmed": 2,
                   "badge":   { "label": "Available", "tone": "supply" } } ],
  "comingSoon":[ { "product": "watermelon",
                   "state":   "expected",
                   "saidAs":  "about twenty pounds every week through September",
                   "window":  { "from": "2026-09-21", "to": "2026-09-30" } | null,
                   "badge":   { "label": "Expected soon", "tone": "supply-quiet" } } ],
  "meta":      { "lastSpokenAt", "freshnessDays" }
}
```

**Deliberate: we ship `badge.label` and `badge.tone` in the payload.** Their map
should not have to re-derive our availability semantics from raw fields — that
is the single most likely way this integration ends up telling a lie on their
site. Same `badgeFor()` from §B, serialised. No quantities on this endpoint
ever; it is the buyer-facing view.

### Open questions for Thelonius (he owns the map side)

*Identity*
- Does BFD have a stable per-farm ID we can key on? Who creates the link between
  a BFD profile and a BreadBasket farm — the farmer, or an admin?

*Direction*
- Pull or push? Do they fetch on marker click (simple, slightly stale), or do
  they want a webhook when a farmer publishes (fresher, more moving parts)?
  Recommendation: pull, with a short cache. Start simple.

*Onboarding — he asked for our thoughts, we want his*
- Does a farmer arrive at BreadBasket *from* BFD (deep link carrying their BFD
  id, profile pre-filled), or sign up with us and get matched afterwards?
  The first is a much better experience and needs BFD to hold a link field.
- What is the minimum a farmer must do before their marker shows a
  "What's in Season" box? One conversation? One published crop?
- What does the marker look like for a BFD farm with *no* BreadBasket data? It
  must not look broken or empty — that's most farms, for a long time.

*Consent and control* — this one matters more than the rest
- Who shows the farmer the "list my availability on the map" toggle: us or them?
- How does a farmer turn it off, and how fast does it take effect?
- If a farmer goes quiet for a month, what does the map show? Our answer today
  is "greyed, with its age" — is that right on someone else's site?

*Practical*
- Auth: public read, or a key? (Public read is simpler and the data is already
  public — but a key gives us abuse control and usage numbers.)
- CORS origins, rate limit, cache TTL they can live with.

### What we build now

The route, the response shape, a seeded farm behind it, and a written contract
doc they can code against — with fake-but-real-shaped data, so their side can be
built before ours is finished. Explicitly `v0`, explicitly subject to change.

---

## §5 — The co-op aggregate stock page

Ask: every product available across the whole co-op, A–Z (apples to zucchini),
aggregated total per crop, filterable by region / state / county / city.

Two hard problems, one of them a values question rather than an engineering one.

### Problem 1 — "aggregated total" collides with a promise we made

The public stand shows **availability only, never quantities.** That is written
down in `NORTHSTAR.md` and enforced in `lib/projections/` — numbers are for the
farmer, and for wholesale buyers in phase two. An aggregate page showing "480 lb
of collards" breaks it for every farmer at once.

There is also a plain mechanics problem: farmers use their own units. Bunches,
pounds, boxes, bushels, jars. We already have a `unit-conflict` state for when
*one farmer* counts one crop two ways — summing across a whole co-op makes that
the normal case, not the exception. There is no honest total to compute.

**Two versions of this page:**

**(a) The honest one, buildable now — count farms, not units.**
> `Collards — available at 4 farms in Alabama`

A–Z, filterable, no unit maths, no promise broken, no consent problem. For the
actual job — a visitor finding food near them — this is arguably *better*: they
want to know where to go, not how many pounds exist.

**(b) The wholesale one — real totals.**
Needs unit normalisation, a buyer-facing gate, and per-farmer consent to
publish their numbers. That is phase two, and it's already scoped that way in
`NORTHSTAR.md` under "deliberately out of scope".

**Recommendation: build (a). Spec (b) as the wholesale phase.** And for the
15 Sept demo specifically, (b) has nothing real to show anyway — with one pilot
farmer, an aggregate of one farm's numbers is just his page with extra steps.

### Problem 2 — we don't store location

`lib/db/schema.ts` has `farms.market`, a free-text string. That's it. No region,
state, county, or city. Region/state/county/city filters need:
- Real location fields on the farm (or the BFD profile as the source of truth —
  see §4; if BFD already holds structured location, we should *not* duplicate it)
- A decision on which is canonical when both have a value
- Backfill for existing farms

**This is the strongest argument for doing §4 before §5.** If BFD is the
directory of record and it already holds structured location, the co-op page
should filter on *their* geography, not a second copy of it that drifts. Worth
asking Thelonius before we add columns.

### Sequencing

1. Confirm with Thelonius: farm-count aggregation for now, totals with wholesale?
2. Settle where location lives (BFD or us) — §4 question, blocks the filters
3. Build the A–Z page with farm counts + whatever geography we've settled
4. Filters last; they're worthless until there are enough farms to filter

For 15 Sept: buildable only against seeded multi-farm data, and it should be
demoed as "here's the shape" rather than as live co-op data. Say that plainly
in the room.

---

## What we need back, in priority order

1. **The demo definition (§0).** Blocks the other five. Needed in days, not
   the week of.
2. **Grey vs. sage for Coming Soon (§1).** We'll build our version; he calls it.
3. **BFD identity + consent answers (§4).** Blocks the API contract.
4. **Farm counts vs. real totals (§5).** Blocks the aggregate page entirely.
