# Breadbasket — North Star

*Working doc. Heart, soul, requirements, and the questions we need the founder to answer.*

Terms used here are defined in [`CONTEXT.md`](./CONTEXT.md). Decisions that are hard to reverse are in [`docs/adr/`](./docs/adr/).

**Founder:** the questions for you are in the boxes marked ❓ **FOUNDER**. There are five. Answer in your own words, in any order, straight into this doc — a sentence is plenty.

---

## The thesis

A farmer should be able to say what they have, in plain language, and have that ripple out to everyone who wants to buy it.

**The value is locked in the frequency.** A farm's inventory is only worth something to a customer if it reflects reality this week. Everything in this document exists to make frequent, honest updating the path of least resistance for the farmer.

---

## What we're building toward

One data spine — the farm's real inventory — with a small number of honest surfaces on top of it.

The farmer talks to the app. The app writes to the spine. Every other surface reads from the spine. There is no second source of truth, and no surface where a human types inventory in twice.

---

## The core loop (three surfaces)

### 1. The chat — how inventory gets in

The farmer chats with an agent in natural language. The agent interprets what they said and offers a **read-back** — its restatement of what it heard. Nothing is written until the farmer approves it; an approved read-back is **published**.

This slows the farmer down. We are choosing that on purpose. A farm inventory that is 80% accurate is worse than useless — it burns customer trust the first time someone drives out for tomatoes that aren't there. Trustworthy data beats fast data, and confirmation is the cheapest way to buy trust.

Every claim the farmer makes carries two independent things:

- **On hand or forecast** — is this stock he has now, or a claim about the future?
- **Measured or estimated** — did he weigh it, or hedge? "About forty pounds" is stored as estimated. The farmer's own uncertainty survives into the record.

Text-only for now.

### 2. The inventory view — what the farmer sees

The behind-the-scenes view of everything the chat has written. This is the farmer's ground truth: what's on hand, what's measured versus estimated, what's flagged as stale, and what harvest rules are standing.

Its job is to make the farmer feel in control of their own record. If they ever feel like the chat is doing things they can't see, we've lost them.

### 3. The farm stand — what the customer sees

The public-facing farm page. Today it's a window onto availability; over time it becomes a real profile with the farm's story in it.

**The stand shows availability, never quantities.** No weights, no counts, no "estimated." Numbers are for the farmer and, later, for wholesale buyers. A customer sees exactly four things:

- **Available** — on hand, spoken about within the freshness window.
- **Available — not confirmed recently** — on hand but flagged; greyed, with "last confirmed N days ago." It stays on the page. Stale should look stale.
- **Coming soon** — a standing harvest rule, shown as the farmer's own sentence: "Watermelon, about 20 lb a week through September."
- **In season** — a badge on everything currently on the stand. A storefront label, not data.

Plus one farm-level line at the top: "last updated N days ago."

---

## What beta taught us

### Harvest cadence

The first beta test broke the model in about two sentences. The farmer said he had forty pounds of tomatoes — fine. Then he said he'd have twenty pounds of watermelon every week through September, and we had nowhere to put it.

Farmers do not think in snapshots. They think in seasons and cadences. So a **harvest rule** is now a first-class concept: a crop, an expected amount, an interval, and an end.

**Decided (see ADR 0001):** a rule is stored *once*, as the farmer's sentence, not expanded into future entries. A rule is a forecast, never stock. Stock only appears when the farmer confirms a real harvest at check-in — "yeah, picked twenty this week." Changing a rule ("make it fifteen") or ending it ("watermelon's done") is a new rule that replaces the old.

If a week goes by and no harvest is confirmed, nothing is wrong and nothing is written. The rule simply ages like stock does: after seven days without the farmer mentioning the crop, it's flagged, and the next check-in asks "still on for watermelon?"

For the POC we only structure **weekly**. Anything else the farmer says — "Tuesdays and Thursdays," "every two weeks," "through the season" — is kept in his own words and surfaced here for a decision.

> ❓ **FOUNDER 1 — How do your farmers actually describe a harvest rhythm?**
> We handle "X pounds of Y every week through Z." What other shapes come up — specific days? Every other week? "Until frost"? Which of those are common enough that a customer needs to see them, versus us just noting them?
>
> *Answer:*

### Spoilage and freshness

**Seven days, flat, across every food type — a temporary POC decision.** It is a *trust* clock (has the farmer checked in?), not a guess about whether the food still exists. Per-crop spoilage logic is sketched and deliberately not built.

**Flag, don't delete — permanent.** Nothing ever disappears from the record or the page because a timer went off. Stale stock is flagged, shown as stale, and stays until the farmer resolves it. "Spoiled" is something only the farmer records.

### The weekly check-in

The farmer is responsible for chatting with the app **at least once per week. No maximum.** More often is always better.

The check-in is the ritual that makes everything else work. It's where:

- Flags get resolved — "still have those forty pounds, or did they go?"
- Harvest rules get reconciled — "picked twenty watermelon this week"
- Estimates get measured, or corrected
- The freshness clock resets

**Decided for the POC: the stale page is the reminder.** There is no push, no email, no text. When the farmer looks at his own stand and sees "not confirmed recently," that's the nudge. Beta testing continues on this basis; it does not wait on the question below.

> ❓ **FOUNDER 2 — Would your farmers respond to a reminder, and on what channel?**
> Right now the only prompt to check in is that their public page visibly goes stale. Should we also text them? Email? Would a reminder feel helpful or like nagging? Is once a week the right rhythm to ask for?
>
> *Answer:*

**Success metric, decided:** weeks with at least one check-in ÷ weeks on platform, per farm. Number of farms is a funnel number, not the measure of whether this works.

> ❓ **FOUNDER 3 — Is weekly check-in consistency the right thing to measure?**
> We're proposing that the POC succeeds if farmers keep checking in, not if we sign up many farms. Does that match how you'd judge it? What would make *you* say this is working?
>
> *Answer:*

---

## Dependencies

### Black Farmers of Maryland

An existing, separately-owned product — a Mapbox-based map of farms with simple profiles. They have already been onboarding farmers. The intended relationship is bidirectional: registering on the map creates a Breadbasket farm; viewing a farm on the map shows live availability from Breadbasket.

**Deferred.** Nothing is designed or built this pass. Named here because for many farmers the map is where the relationship starts, not us.

> ❓ **FOUNDER 4 — Who owns the Black Farmers of Maryland relationship, and what access do we have?**
> Can we talk to whoever runs it? Do we have, or could we get, a way to read their farm list? Is a farmer's identity there (email, phone) the same one they'd use with us?
>
> *Answer:*

---

## Deliberately out of scope

### Wholesale storefront

A different audience (buyers, not consumers), a different economic model (paid gate), and a different view of the same inventory — the one that *does* show quantities. Phase two, once the farmer loop demonstrably works.

### Founder question board (in-app)

Considered and dropped. This document *is* the board. Questions live here, answers go in here, and resolved questions get folded into the text above and removed.

> ❓ **FOUNDER 5 — Does answering here work for you?**
> If you'd rather talk through these than write, say so and we'll do that instead. Anything you want to add that we haven't asked?
>
> *Answer:*

---

## This week

**Primary goal:** close the gap beta exposed, so a farmer can describe a whole season in one conversation — and get the founder's answers moving.

- [x] Decide cadence semantics — one standing rule (ADR 0001)
- [x] Define harvest cadence as a product concept (above, and `CONTEXT.md`)
- [x] Decide the check-in mechanic — page degradation only
- [x] Write the seven-day rule as temporary, flag-don't-delete as permanent
- [x] Decide the success metric
- [x] Replace the in-app question board with this doc
- [ ] Share this doc and [`DESIGN.md`](./DESIGN.md) with the founder
- [x] Build the minimal harvest-rule store: parse "X every week through Y" into a rule, read it back; anything unparseable kept verbatim as a note
- [x] Split the farm stand into available now / coming soon, with the four labels and the freshness line; remove quantities
- [x] Ship the "In season" badge
- [x] Show measured / estimated / flagged in the inventory view and in read-backs
- [ ] Second beta conversation with a real farmer, against the build above, specifically to stress-test cadence
- [ ] Black Farmers of Maryland — deferred
