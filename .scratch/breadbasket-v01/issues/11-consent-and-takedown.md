# Consent, takedown, and data ownership

Type: grilling
Status: closed — out of scope
Audience: us
Blocked by: —

## Closed

Out of scope for v0.1. This was charted from the north star's takedown promise before the pilot shrank to a single farmer who *is* the founder, and it was never re-tested against that change. At n=1 there is nothing to take down: the public view is a dev URL only he sees, no buyer is relying on a listing, and the person who would exercise the right owns the company.

It returns with the first farmer who isn't the founder — which is also the first moment the promise has anyone to make it to. Not on this map.

**One constraint carried forward instead.** Don't build anything that makes erasure impossible later. Concretely: every movement stays attributable to a farm, and farm-identifying data does not get denormalised into places a future purge could not find it. That costs nothing now and is the whole reason this ticket existed.

**Left unresolved on purpose** — the genuine tension between an append-only ledger and "their data is theirs", and the observation that "their data is theirs" carries specific weight for farmers sourced from the Black Farmer Directory, given the documented history of USDA discrimination and land dispossession. That is a real product question with a real bearing on adoption, and it deserves the founder rather than an engineering default. It is recorded here so the next effort inherits the thinking rather than starting cold.

## Question

The north star is unambiguous: a farmer should be able to say "take my page down" and have it happen instantly. Their data is theirs.

- What does **instantly** mean — public view dark immediately, or data erased? Those are different promises.
- Is takedown a **state on the farm** or a bulk withdrawal of every live item? [The availability record shape](01-availability-record-shape.md) may already have a slot for one of these.
- Does the agent recognise it **conversationally**, or does it need a control on the page? A conversational-only kill switch is elegant but risks a parse failure at the worst possible moment.
- Is takedown **reversible** — can the farmer come back, and does old data return?
- What happens to **retained history** on takedown, if history is retained at all?
- What is the farmer told when it takes effect, so they can trust it happened?

## Why it matters

Trust is the product's foundation. A takedown that half-works is worse than one that does not exist.
