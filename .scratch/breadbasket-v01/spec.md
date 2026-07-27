# BreadBasket v0.1 — Conversational Farm Inventory Agent

Status: ready-for-agent

Derived from the wayfinder map at [map.md](map.md). Decisions cite the ticket that settled them; anything marked **OPEN** is genuinely undecided, not omitted.

---

## Problem Statement

A farmer knows what he has. Nobody else does.

The founder of BreadBasket keeps his farm's inventory in a paper notebook and uses it to get ready for Saturday's farmers market. The notebook works — it is fast, offline, needs no login, works in a truck, and never misunderstands him. What it cannot do is tell anyone else. So the information that a chef or a family needs — *who has what, right now, near me* — never leaves the farm.

Every existing platform's answer is a storefront the farmer maintains. Some will. Most won't, and can't be blamed — they're farming. The result is directories full of listings that went stale in 2023, which teaches buyers not to trust them, which makes the whole category worse than useless.

The hurdle is not discovery, payments, or logistics. **The hurdle is inventory updating.**

The inventory update already happens — it happens in speech. Farmers already tell people what they have every week: at market, on the phone, in text threads with regulars. Nobody has to be persuaded to do it. It just isn't captured.

## Solution

An agent the farmer talks to, that turns what he says into structured, published, expiring availability data — and never publishes something he hasn't confirmed.

He says what he has, in his own words, however he'd say it to a neighbour. The agent parses it, reads back what it heard, and publishes only when he confirms. Availability is held as a **ledger**: what he says are *movements* against a running stock position, not a form he fills in. "I've got 50 pounds of tomatoes" adds. "Sold about half at market" removes. "I just weighed everything, 50.6" is a true-up that resets the figure regardless of what the arithmetic said. "About 30 more ready next week" is a forecast against a later window.

Everything published carries an expiry. Unconfirmed listings lapse and disappear rather than lying — the system would rather show less than show something false. And because some figures are weighed while others are estimates stacked on estimates, the current number carries its own provenance: a buyer sees whether it was measured or guessed, and the farmer gets prompted to go weigh something when the guesswork has piled up too high.

**For v0.1 the surface is a chat web app**, used by one farmer — the founder, on his own farm — with a public availability page he can check. SMS and voice are the eventual channels and are deliberately not built yet.

**v0.1 is judged on whether he keeps using it instead of the notebook.** The buyer-facing thesis is unchanged and remains the destination; v0.1 simply has no buyers in it to be judged by.

## User Stories

**Telling the agent what he has**

1. As a farmer, I want to say what I have in my own words, so that I don't have to learn a form or a vocabulary that isn't mine.
2. As a farmer, I want to mention several products in one breath, so that I don't have to enter them one at a time.
3. As a farmer, I want to say "sold about half at market" and have the number go down, so that I'm describing what happened rather than doing arithmetic.
4. As a farmer, I want to say "I just weighed everything, 50.6 pounds," so that an actual measurement overrides whatever the running estimate had drifted to.
5. As a farmer, I want to say "about 30 pounds ready next week," so that I can tell people what's coming without claiming to have it now.
6. As a farmer, I want to say "no more squash," so that sold-out is something I state rather than something inferred from my silence.
7. As a farmer, I want to give a vague amount — "a good amount", "nearly out" — so that I'm not forced to invent a precision I don't have.
8. As a farmer, I want to use my own units — bushels, flats, a mess of, a head — so that I'm not translating into someone else's system.
9. As a farmer, I want to say something whenever I like rather than only at a set time, so that the system reflects reality between check-ins.

**Being understood, and correcting when I'm not**

10. As a farmer, I want the agent to read back what it heard before anything is published, so that I catch its mistakes instead of buyers catching them.
11. As a farmer, I want to confirm with one action, so that publishing takes seconds.
12. As a farmer, I want to fix one wrong line without redoing the whole update, so that a single misunderstanding doesn't cost me the session.
13. As a farmer, I want the agent to learn my words as I use them, so that I never sit through a setup process defining my crops.
14. As a farmer, I want my correction to stick, so that I don't correct the same misunderstanding every week.
15. As a farmer, I want the agent to ask at most one short question when it's genuinely stuck, so that being understood doesn't become an interrogation.
16. As a farmer, I want products I didn't mention to be left alone, so that silence doesn't wipe out my inventory.

**Freshness and trust**

17. As a farmer, I want listings to expire on their own, so that I'm never accidentally advertising food I no longer have.
18. As a farmer, I want different crops to expire at different rates, so that greens and winter squash aren't treated the same.
19. As a farmer, I want to be told when my numbers have drifted too far from a real measurement, so that I know when it's time to go weigh something.
20. As a buyer, I want to see when a figure was last confirmed, so that I can judge whether to trust it.
21. As a buyer, I want to see whether a quantity was weighed or estimated, so that I know how precise it is before I drive out.
22. As a buyer, I want expired listings to be absent rather than marked stale, so that everything I see is a live claim.
23. As a farmer, I want the system never to publish a guess as fact, so that my reputation isn't spent on its mistakes.

**Getting ready for market — the pilot's real job**

24. As a farmer, I want to see everything I currently have in one view, so that it replaces the notebook I check before market.
25. As a farmer, I want to see what's about to lapse, so that I know what to sell or re-confirm first.
26. As a farmer, I want to see which numbers are guesses, so that I know what to weigh.
27. As a farmer, I want to see what's forecast for next week alongside what I have now, so that I can plan.
28. As a farmer, I want this view to work on my phone in a barn, so that it's usable where the notebook was.

**Being reminded, without being spammed**

29. As a farmer, I want a check-in prompt at a predictable time each week, so that updating becomes a habit rather than a thing I forget.
30. As a farmer, I want one reminder if I miss it, and only one, so that the system never feels like spam.
31. As a farmer, I want a missed week to lapse quietly rather than publish stale claims, so that forgetting is safe.

**Understanding the machine**

32. As the founder, I want to see which tools the agent called and what they returned, rendered visually rather than as raw JSON, so that I can understand how it works.
33. As the founder, I want that view to be a detail level of the normal interface rather than a separate admin panel, so that what I see is what actually happened.
34. As the founder, I want failures to be visible — an empty parse, an unresolved product, a retry — so that I learn where it's weak.
35. As the founder, I want the flow view to suggest what else the agent could do, so that using it generates product ideas.

**Reaching it at all**

36. As a farmer, I want to reach the app without creating an account or remembering a password, so that there is nothing between me and talking to it.
37. As a buyer, I want to see a farm's current availability without signing in, so that there's no barrier to looking.

**Operating it**

38. As the operator, I want every transcript and parse result retained, so that I can review how well it understood him and build an evaluation set later.
39. As the operator, I want to change how long a crop stays fresh without a code change, so that tuning is configuration.
40. As the operator, I want to reconstruct how a published number was arrived at, so that "the page said 50 pounds" is answerable.
41. As the operator, I want scheduled work to survive a crash and retry, so that a missed nudge is a bug rather than a silent gap.

## Implementation Decisions

### Domain model — a ledger of movements with a derived balance

*(from [The availability record shape](issues/01-availability-record-shape.md))*

Availability is a **running stock position**, not a snapshot of claims. The stored unit is an append-only movement; the current quantity is derived. This shape came out of a grilling session and encodes the decision more precisely than prose:

```
movement                          (append-only; the only source of truth)
  farm_id
  product          normalised term + the raw phrase as said
  kind             add | remove | spoil | trueup
  amount           { value, unit }
  measured         true = weighed/counted, false = estimated
  window           { from, to }
  state            forecast | confirmed
  source           farmer | order        (order not built in v0.1)
  session_id
  occurred_at

session
  id
  covered          whole_farm | mentioned_only
  occurred_at
  channel          chat-pwa

derived, per (farm, product, window) — never stored as truth
  quantity       = fold(movements)
  last_trueup_at
  estimate_debt  = estimated movements since the last trueup
  confirmed_at   = latest confirming movement
  expires_at     = confirmed_at + freshness window   (parameter)
  live           = now < expires_at
```

`trueup` is an **absolute**: it resets the balance to the stated figure regardless of accumulated arithmetic. This is what makes the model survivable in the presence of estimates.

**Two independent signals with different jobs.** Expiry governs *liveness* — the window closes, the item disappears. Estimate debt governs *annotation* — it never hides anything, it marks a figure as weighed or estimated and past a threshold prompts a stocktake. A buyer sees `50.6 lb · weighed · confirmed today` or `~25 lb · estimated · confirmed 2 days ago`, and never sees a lapsed item.

**Omission needs no rule.** An unmentioned product means *no movement*, so its balance stands until its freshness window closes. Sold-out is a movement the farmer makes, not an inference drawn from silence.

**`source` exists from day one** even though ordering is out of scope, because a future order-driven decrement must not be a migration of the one table that matters. It also means the farmer's balance can drop without him acting — which is why north-star principle 3 is amended below.

### Architecture

*(from [Is BreadBasket a persistent brain or a web app?](issues/23-agent-runtime-shape.md))*

- **One multi-tenant service, many farms.** A farm is a row, not an instance. Not one agent per farmer — that shape (OpenClaw, Hermes Agent) fits a one-farmer pilot perfectly and is structurally wrong for a product, and at n=1 the two are indistinguishable.
- **Serverless plus a durable workflow layer.** Route handlers carry the conversation; the durable layer carries anything that must survive a crash or span turns. No server to own. "Always on" is simulated, not literal — acceptable for chat and scheduled nudges, and the specific assumption to re-test when voice arrives.
- **Identity without login.** One farm behind one secret URL. No accounts, no passwords.

### Modules

Eight modules. The first three own the domain and stay free of model and browser concerns.

- **Ledger** *(deep)* — movements in, balances out. Owns folding, true-up semantics, expiry derivation, estimate-debt accumulation. Interface along the lines of `record(movement)`, `balance(farm, product, window)`, `estimateDebt(farm, product)`. Pure logic. **The correctness of the product lives here** — nothing else needs to know how a balance is computed. This is the seam that matters most: if this interface is right, the record shape can change underneath without touching the conversation, the projections, or the adapter.
- **Vocabulary** *(deep)* — farm-scoped term→product mapping that accretes from use. `resolve(term, farm)`, `learn(term, product, farm)`. This *is* the onboarding mechanism.
- **Freshness** *(deep)* — per-product windows, expiry, and the estimate-debt threshold. `expiresAt`, `isLive`. Entirely configuration-driven, which is what makes cadence a dial rather than a schema change.
- **Extraction** — `extract(utterance, vocabulary) → CandidateMovement[]`. Wraps the model call, the flat schema, and validate-and-retry.
- **Agent core** — the loop: extract → resolve → propose → await confirmation → record. Emits tool calls. Channel-agnostic; this is where the spec constraints below are enforced.
- **Chat-PWA adapter** — the only channel-aware code. Maps tool calls to rendered components and confirmations back to the core. Owns the chat/parts message model so the domain never sees it.
- **Projections** — two read models over the ledger: the farmer's inventory view and the public availability page. Derived, never authoritative.
- **Schedules** — durable jobs: the weekly check-in, the lapse nudge, the stocktake prompt.

### Structured extraction

*(from [Structured extraction with the AI SDK](issues/04-structured-extraction.md), asset: [the research memo](research/framework-model-provider-memo.md))*

- Structured output goes through a schema-constrained call using each provider's native strict-schema mode. Plain JSON mode carries a 2–5% schema-mismatch rate and is not used.
- **The extraction schema stays flat.** Compliance degrades measurably past 3–4 levels of nesting across providers. The movement shape above is flat apart from `amount` and `window`, both one level — so no separate storage shape is needed and there is no translation layer to carry bugs.
- **No numeric constraints in the schema.** Anthropic's supported subset excludes `minimum`/`maximum`/`multipleOf`, so quantity bounds live in application code.
- **Uncertainty is not stored as a range.** `measured: false` plus accumulated estimate debt carries it. Being precise about imprecision is a trap; tracking that it compounds is tractable.
- Partial and uncertain extraction is handled by **validate-and-retry**: parse, one reprompt on failure.
- **Inferring the movement `kind` is the highest-stakes operation in the system.** Mistaking a delta for an absolute silently corrupts the balance — worse than getting a quantity wrong, because nothing surfaces it.

### Vocabulary accretes conversationally

*(from [The normalisation target shape](issues/06-normalisation-target-shape.md))*

There is no onboarding step and no canonical produce taxonomy. The agent normalises optimistically, shows its interpretation in **the read-back it was already going to show**, and a correction teaches the vocabulary. This costs **zero additional questions** — which matters because a farm has dozens of terms and the product allows at most one short clarifying question.

### Spec constraints (non-functional)

These replaced a channel-seam design ticket, which was closed as architecture-on-speculation. They are enforceable by review.

1. Conversation state is serializable and channel-agnostic, in our own database — never component state, never a provider's session or thread store.
2. No synchronous non-streaming request/response assumption in the agent core.
3. No provider's raw SDK hard-coded; go through a provider-agnostic interface.
4. No channel assumptions — markdown, buttons, component rendering — inside the domain layer. Tool-call-to-component mapping lives in the chat-PWA adapter.
5. Movements stay attributable to a farm; farm-identifying data is not denormalised anywhere a future purge could not find it.
6. Retain every transcript and parse result.

### Settled scope premises

- The chat PWA is the v0.1 farmer-facing surface; SMS and voice are v0.2.
- The model is source-agnostic — availability carries provenance and channels are adapters — but v0.1 implements exactly one adapter.
- Availability records carry a validity window and a confirmation state from the start, but v0.1 writes only current-window confirmed records and displays only those. Forecast entry and the two-column display are v0.2 — a feature flag, not a migration.
- The pilot is one farmer: the founder. His farm is the seed farm, so location is constant and distance and discovery need no solving.
- Check-in rhythm: a prompt Sunday 7pm, one reminder 7am Monday. One check-in, one reminder.
- Forecasts are farmer-stated, never derived. The system will have no history to derive from for years.
- The public view exists as a dev URL the founder is pointed at, so the freshness promise is checkable.

### Still OPEN — required before build

- **Units and quantity** — what unit families exist, which products are habitually spoken in which, and whether a buyer needs a number at all. *Founder.* Blocks extraction and normalisation.
- **Freshness windows** — how long each crop stays true, whether it varies by season, and whether defaults or per-item entry is right. *Founder.*
- **The estimate-debt threshold** — how many guesses, or how much drift, before a number stops being worth publishing. *Founder.*
- **The confirmed/unconfirmed arithmetic** — "100 confirmed, 200 unconfirmed" is 300 total, or a 200 forecast of which 100 are confirmed? *Founder.*
- **The exact conversational behaviour** — the actual words of the check-in, read-back, confirmation, correction, lapse nudge, and stocktake prompt. Blocked on units. Note the stocktake prompt is a *third* proactive message alongside the check-in and the lapse nudge, which strains "one check-in and one nudge, ever" and has to earn its place.
- **The agent's tool surface** — how many tools, at what granularity. Because UI renders from tool calls, granularity is a **UI contract**, not an implementation detail: coarse tools are easier to build and show the founder nothing.
- **Model and provider choices**, the durable-execution layer, and the store. Verify model IDs and pricing against current sources rather than the research memo, which contained four errors in its Anthropic figures.
- **Cold start** — the very first exchange, when the agent knows nothing about the farm and has no vocabulary.
- **Pilot failure condition and time bound** — see Further Notes.

## Testing Decisions

**What makes a good test here:** assert external behaviour through a module's public interface, never its internals. A ledger test says "record these movements, then this balance is what comes out" — it does not inspect how the fold works. Tests must survive a change of storage engine and a change of record shape; if a test breaks when the implementation changes but the behaviour doesn't, it was testing the wrong thing.

**No prior art.** This is a greenfield repo — a bare application scaffold with no test suite and no testing library installed. The first module tested establishes the pattern; there is nothing to imitate. Worth choosing the runner deliberately rather than inheriting one.

**Modules to be tested:**

- **Ledger** — the priority, because arithmetic correctness *is* the product and it is the one place a silent bug publishes a lie. Cover: deltas accumulating; a `trueup` resetting the balance regardless of prior arithmetic; estimate debt accumulating across estimated movements and resetting on a true-up; expiry derivation at the boundary; an unmentioned product's balance persisting; a `remove` with `source: order` reducing the balance identically to a farmer-stated one; balances scoped correctly per farm and per window. Pure functions, no mocks.
- **Vocabulary** — resolution of a known term; learning from a correction; the same term resolving differently for different farms; and the conflict case where a mapping is corrected twice in opposing directions. This guards the failure where "greens" silently resolves to the wrong greens.

**Explicitly not tested in v0.1:** Extraction (needs the founder's recordings as fixtures first, and lands after that task), the adapter, projections, and schedules. Extraction is the notable deferral — the reasoning is that a formal parser evaluation was ruled out of scope for the pilot because every parse is read back and confirmed by the founder before publishing, so reading transcripts is the evaluation loop. That reasoning stops holding the moment a farmer who isn't the founder uses it.

## Out of Scope

- **SMS, voice, and telephony** — v0.2. The eventual channels, deliberately not built. The spec constraints above exist so they arrive as transports rather than a rewrite.
- **Buyer accounts, standing wants, and matching** — v0.2.
- **Forecast entry and the two-column confirmed/unconfirmed display** — modelled for, not built. Forecast data has no consumer without buyers, so it could not be validated in this pilot.
- **Derived forecasting from historical data** — a different product, and years of data away.
- **Ordering, payments, delivery — and with them reservations and holds.** The failure mode is named and understood: if the page says 50lb and two restaurants each order 40, the system has promised 80. Same incident as "drove out and they were gone," but caused by us rather than by staleness.
- **Platform ingestion adapters** — reading availability from Barn2Door, Local Line, Square. The aggregation thesis is modelled for; note that ingesting from a stale source would inherit exactly the rot this product exists to fix, so ingested data would need re-confirming anyway.
- **BFD sync and access** — farmers will be sourced from the Black Farmer Directory eventually; there is no integration to design against at one farmer.
- **Consent, takedown, and data ownership** — at n=1 there is nothing to take down and nobody to make the promise to. Constraint 5 above keeps erasure possible. The unresolved tension — an append-only ledger against "their data is theirs" — is recorded on the closed ticket.
- **A formal parser evaluation** — golden sets and pass bars are for a parser whose errors reach people silently.
- **Farmer dashboards or native apps; reviews and ratings; photos.**
- **Multi-farmer concerns** — recruitment, onboarding at scale, several farms competing for attention, multiple people answering for one farm.
- **Geo, distance, and "near me" discovery** — meaningless with a single known farm.
- **Voice-interface component libraries** — a good reference point, but they belong with the v0.2 voice work.

## Further Notes

**Success criteria for the pilot** *(from [What convinces us this works at n=1](issues/12-n-of-1-success.md))*

1. He gets in and talks to the agent easily, and is impressed.
2. While talking to it, he sees the tool calls expressed as a visual flow — **and it gives him ideas for more tool calls.** This is a generative bar, not a comprehension one: passing is not "he understood," it is "he came back with things he wants it to do."
3. Afterwards he can see his inventory in a way that makes him want to use it again next week for market prep, **instead of the paper notebook he uses now.**

Two gaps, flagged rather than invented: **no failure condition** and **no time bound**. What would make him stop, and how long the pilot runs before a call is made, are unanswered — a pilot with only pass conditions can run indefinitely. Also note criteria 1 and 2 are observable by watching him, while criterion 3 is a claim about *his* future behaviour and is the one that genuinely needs his confirmation.

**The incumbent is a paper notebook.** Fast, offline, works in a truck, needs no login, never misparses anything. A stronger competitor than it sounds. Anything this product does worse has to be paid for by something the notebook cannot do at all: arithmetic that stays correct, expiry that hides stale claims, and a public page that updates itself. Keep the benchmark and the thesis apart — the destination is buyer-focused, and v0.1 simply has no buyers in it to be judged by.

**Amendment to north-star principle 3.** *"The farmer confirms everything — it never publishes a guess"* is too strong as written. A sale the system processed is a **fact**, not a guess, and it changes availability without the farmer confirming it. The rule is really *never publish an unconfirmed inference*; facts the system knows independently are a different category. This matters the moment orders exist.

**Standing constraint — speech-recognition disparity.** Peer-reviewed work (Koenecke et al., PNAS 2020, 117(14):7684–7689) documents roughly double the word-error rate for Black speakers versus white across all five major commercial ASR systems — average 0.35 against 0.19 — worst for rural Southern African American English and for African American men, with over 20% of Black samples effectively unusable against under 2% for white. Academic CORAAL benchmarks show rural Southern AAE as the hardest subset. Phone audio compounds it, and vendor-neutral leaderboards do not publish these breakdowns.

Voice is out of scope, but this is not merely a v0.2 vendor question. It is a **permanent argument for keeping confirm-before-publish as an accuracy safety net** rather than an onboarding nicety, and for evaluating any future speech vendor on this network's own audio rather than on published benchmarks. It also raises the stakes on the data-ownership question above: the farmers this product serves have documented historical reasons to be wary of institutional data collection about their land and operations.

**Cost at pilot scale** is negligible — token spend for one farmer is well under a dollar a month; the real cost is platform subscriptions.
