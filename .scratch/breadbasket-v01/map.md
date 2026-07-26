# BreadBasket v0.1 — availability capture

Label: `wayfinder:map`

## Destination

A buildable v0.1 spec for BreadBasket: the conversational inventory agent in a chat PWA, plus the public availability view. Complete enough to hand to `/to-spec` → `/to-tickets` without further questions.

Planning only. Tickets resolve decisions; nothing here ships production code.

## Notes

**Domain.** Local food availability. The product promise is freshness: what is listed is actually available. Every decision defers to that.

**Skills.** `/grilling` and `/domain-modeling` are the default for any ticket. `/prototype` for prototype tickets, `/research` for research tickets. Load the `marketplace` skill before recommending any external provider. This repo runs a Next.js version with breaking changes — read `node_modules/next/dist/docs/` before writing any code.

**Audience convention.** Every ticket carries an `Audience:` line — `us` or `founder`. A founder ticket is not blocked; it is answerable only by the founder and must be batched into a digest and sent. Founder tickets on the frontier put the founder on the critical path.

**Settled while charting** (not tickets — these are premises):

- The chat PWA is the v0.1 farmer-facing surface. SMS and voice are v0.2.
- The domain model is source-agnostic — availability carries provenance, and channels are adapters. v0.1 builds exactly one adapter.
- Availability is a **ledger of movements with a derived balance**, with **per-product freshness**, so cadence is config rather than schema. *(Amended: this was originally "a snapshot the farmer confirms." A check-in is either a true-up or a set of deltas — see [The availability record shape](issues/01-availability-record-shape.md). Per-product freshness is unchanged.)*
- Availability records carry a **validity window** and a **confirmation state** (`forecast` / `confirmed`) from the start, but v0.1 writes only current-week, confirmed records and displays only those. Forecasting is modelled for, not built — same discipline as the channel seam.
- The check-in **rhythm** is set by the founder: ping Sunday 7pm, reminder 7am Monday. One check-in, one reminder.
- Forecasts are **farmer-stated**, never derived. The system will have no history to derive from for years.
- **The pilot has to look good.** The founder's first impression of the surface is part of what the pilot tests, so visual quality is in scope, not polish deferred to later.
- **The founder needs to see the flows.** Tool calls render as generated UI, not raw JSON. This makes the agent's tool set a UI contract — see [The agent's tool surface](issues/21-agent-tool-surface.md).

**The destination is buyer-focused; v0.1's *measure of success* is not.** Keep these apart. BreadBasket's thesis is unchanged — a living availability layer that lets demand find supply while it is still fresh, with buyers as the point. But v0.1 has no buyers in it, so the pilot cannot be judged on buyer outcomes. It is judged on whether the founder keeps using it, and the thing it has to beat there is **his paper notebook**, used to get ready for Saturday's farmers market. See [What convinces us this works at n=1](issues/12-n-of-1-success.md).

That makes the notebook a **benchmark for v0.1**, not a redefinition of the product. Practically: the farmer-facing surfaces have to be genuinely good or the pilot fails, and a notebook is a stronger incumbent than it sounds — fast, offline, works in a truck, needs no login, never misparses anything. Anything we do worse than it has to be paid for by something it cannot do at all: arithmetic that stays correct, expiry that hides stale claims, and a public page that updates itself — which is where the buyer thesis re-enters.

**Spec constraints — enforceable by review, no design session needed.** These replaced [The channel adapter seam](issues/08-channel-adapter-seam.md), which was closed as architecture-on-speculation: with one adapter there is no second case to test a boundary against. What the seam protected survives as rules.

1. Conversation state is serializable and channel-agnostic, in our own database — never React state, never a provider's session or thread store.
2. No synchronous non-streaming request/response assumption in the agent core.
3. No provider's raw SDK hard-coded — go through the provider-agnostic interface.
4. No channel assumptions (chat markdown, buttons, component rendering) inside the domain layer. Tool-call-to-component mapping lives in the chat-PWA adapter.
5. Movements stay attributable to a farm; farm-identifying data isn't denormalised where a future purge couldn't find it.
6. Retain every transcript and parse result. Free to keep, and it is the eval set the moment there is something to evaluate.

**Amendment to north-star principle 3.** *"The farmer confirms everything — it never publishes a guess"* is too strong as written. A sale the system processed is a **fact**, not a guess, and it changes availability without the farmer confirming it. The rule is really *never publish an unconfirmed inference*; facts the system knows independently are a different category. This matters the moment orders exist — see the `source` field in [The availability record shape](issues/01-availability-record-shape.md).

**Standing constraint — ASR disparity.** Peer-reviewed work (Koenecke et al., PNAS 2020) documents roughly double the word-error rate for Black speakers versus white across all five major ASR systems, worst for rural Southern AAE and for African American men, and phone audio compounds it. Voice is out of v0.1 scope, but this is not merely a v0.2 vendor question: it is a permanent argument for keeping **confirm-before-publish** as an accuracy safety net rather than an onboarding nicety, and for evaluating any future STT on this network's own audio rather than on published benchmarks, which do not break out these figures. Sources in [the research memo](research/framework-model-provider-memo.md).
- The pilot is **one farmer: the founder**. His farm is the seed farm.
- Identity for v0.1 is one farm behind one secret URL. No login.
- No canonical product taxonomy up front — the agent normalises free text into a known shape.
- The public view is **in**, as a dev URL the founder is pointed at for testing. Location is constant, so distance and discovery do not need solving.

**Terminology.** `CONTEXT.md` is deliberately not created yet — [The availability record shape](issues/01-availability-record-shape.md) pins the core terms, and writing them down before it resolves would just duplicate its output.

## Decisions so far

<!-- one line per closed ticket: gist + link -->

- [What convinces us this works at n=1](issues/12-n-of-1-success.md) — Three criteria: he gets in and talks to it and is **impressed**; the tool-call flow view **gives him ideas for more tool calls** (a generative bar, not a comprehension one); and afterwards his inventory reads well enough that he wants to use it again next week for market prep **instead of his paper notebook**. Developer-defined, not yet founder-confirmed; no failure condition or time bound stated.
- [The availability record shape](issues/01-availability-record-shape.md) — **A ledger of movements with a derived balance**, not a snapshot of claims. `add / remove / spoil / trueup`, each carrying `measured`, a `window`, a `state`, and a `source`. Expiry governs liveness (lapsed items vanish); accumulated estimate debt governs annotation (`weighed` vs `estimated`) and prompts a stocktake. **Dissolves the omission question** — silence means no movement, so the balance stands. `source` exists from day one so future order-driven decrements aren't a migration.
- [Is BreadBasket a persistent brain or a web app?](issues/23-agent-runtime-shape.md) — **One multi-tenant brain, many farms**, on **serverless plus a durable workflow layer**. A farm is a row, not an instance; no server to own; conversation state and snapshots stay ours, serializable and channel-agnostic. OpenClaw and Hermes are the right *shape* but personal-assistant architected, so ruled out as the runtime — their gateway pattern is worth stealing. Does not redraw the destination.
- [Chat UI component options](issues/19-chat-ui-components.md) — Tap-to-confirm ships nowhere ready-made; the real substrate is the AI SDK's **tool-approval state machine**, which is confirm-before-publish as a primitive but built for one call, not a list. Generative UI has a verified pattern (`message.parts[]` matched on `tool-${name}`) that maps onto the proposed tool surface. Copy-in options exist; all carry a channel-shaped message model that must stay in the adapter.
- [Structured extraction with the AI SDK](issues/04-structured-extraction.md) — Zod schema through `generateObject`, native strict-schema mode per provider, validate-and-retry on failure; **the snapshot schema must stay flat**, and no numeric constraints on quantity. Schema-valid ≠ semantically correct, so the confirm loop remains the real safeguard. Findings only — the stack choice is a separate decision. Asset: [the research memo](research/framework-model-provider-memo.md), with four corrections in its verification addendum.

## Not yet specified

In scope for v0.1, not yet sharp enough to ticket:

- **Onboarding** — mostly dissolved. There is no onboarding gate: vocabulary accretes conversationally and the read-back is the teaching mechanism (see [The normalisation target shape](issues/06-normalisation-target-shape.md)). What is left is only the cold-start question — the very first exchange, when the agent knows nothing about his farm and has no vocabulary at all.
- **Parse-failure escalation.** What happens when the agent genuinely cannot understand, and who catches it during a one-farmer pilot.
- **Photos.** Ruled out in the north star because SMS made them awkward. A PWA makes them nearly free, so the reasoning may no longer hold.

## Out of scope

Beyond the v0.1 destination. Closed — these return only if the destination is redrawn, and then as a fresh effort.

- **SMS, voice, telephony** — deferred to v0.2. The adapter seam exists so they arrive as transports, not a rewrite.
- **Platform ingestion adapters** (Barn2Door, Local Line, Square) — the aggregation thesis is modelled for, not built.
- **BFD sync and access** — non-blocking for a one-farmer pilot. Farmers will be sourced from BFD eventually, but with no integration to design against, [The BFD public surface](issues/05-bfd-public-surface.md) is closed too; the farmer model gets revisited when adoption is real.
- **Surveying scheduled-nudge delivery** — [Scheduled nudge delivery to a PWA](issues/13-scheduled-nudge-delivery.md) closed. At one farmer a plain outbound text or a human nudge is a legitimate answer, so the delivery *decision* survives as an unblocked ticket while the web-push research does not.
- **Buyer accounts, standing wants, matching** — v0.2.
- **Forecast entry and the two-column display** — the founder's "100lbs confirmed, 200 unconfirmed" and the six-month farm-to-school horizon. Genuinely good, and structurally accommodated by the record shape, but it ships with buyers in v0.2: forecast data has no consumer in a one-farmer pilot, so it could not be validated here. This graduated the old *future-dated availability* fog patch — the modelling half went into [The availability record shape](issues/01-availability-record-shape.md), the building half came here.
- **Derived forecasting from historical data** — a different product, and years of data away.
- **Voice-interface component libraries** — [VapiBlocks](https://www.vapiblocks.com/) and equivalents are drop-in UI for voice AI, and a good reference point, but they belong with the v0.2 voice work. The in-scope question they prompted — what the chat equivalent is — became [Chat UI component options](issues/19-chat-ui-components.md).
- **Ordering, payments, delivery** — and with them **reservations and holds**. The founder named the failure mode: if the page says 50lb and two restaurants each order 40, the system has promised 80. That is the same incident as "drove out and they were gone," but caused by us rather than by staleness, which is worse — staleness is a known enemy and this one arrives in uniform. Nothing is built for it; the `source` field on movements is what keeps it from being a migration later.
- **Farmer dashboards or native apps.**
- **Reviews and ratings.**
- **A formal parser eval** — [the ticket](issues/18-parser-eval.md) is closed. Golden sets and pass bars are for a parser whose errors reach people silently; at n=1 every parse is read back and confirmed, and the one user is the founder, so reading transcripts *is* the eval. Constraint carried forward: retain every transcript and parse result.
- **Consent, takedown, and data ownership** — [the ticket](issues/11-consent-and-takedown.md) is closed. Charted from the north star before the pilot shrank to one farmer who *is* the founder; at n=1 there is nothing to take down and nobody to make the promise to. One constraint carried forward instead: movements stay attributable to a farm and farm-identifying data isn't denormalised anywhere a future purge couldn't find it. The unresolved tension — append-only ledger versus "their data is theirs", which carries particular weight for BFD-sourced farmers — is recorded on the ticket for whoever picks it up.
- **Multi-farmer concerns** — recruitment, onboarding at scale, several farms competing for attention.
- **Multiple people answering for one farm** — real in the world, not at n=1.
- **Geo, distance, and "near me" discovery** — meaningless with a single known farm.
