# The availability record shape

Type: grilling
Status: resolved
Audience: us
Blocked by: —

## Answer

**Availability is a ledger of movements with a derived balance.** Not a snapshot of claims — a running stock position.

This replaced the original framing during the session. Independent supersessions model a series of *assertions about the world*; a farm is a *position that changes*. He has tomatoes, sells about half at market, adds twenty pounds the following week, then weighs everything and says 50.6. Each of those is a change to a balance, and the balance is what a buyer reads.

### The stored unit — movements, append-only

```
movement
  farm_id
  product        normalised term + the raw phrase as said
  kind           add | remove | spoil | trueup
  amount         { value, unit }
  measured       true = weighed/counted, false = estimated
  window         { from, to }
  state          forecast | confirmed
  source         farmer | order          (order not built in v0.1)
  session_id     -> session
  occurred_at
```

`trueup` is an **absolute**, not a delta: it resets the balance to the stated figure regardless of what the arithmetic said. "I just weighed everything, 50.6 pounds" is a first-class operation rather than a correction, which is what makes the whole model tolerable in the presence of estimates.

```
session
  id
  covered        whole_farm | mentioned_only
  occurred_at
  channel        chat-pwa
```

### The derived balance

Per `(farm, product, window)`, folded from movements — never stored as the source of truth:

```
quantity        = fold(movements)
last_trueup_at
estimate_debt   = estimated movements since the last trueup
confirmed_at    = latest confirming movement
expires_at      = confirmed_at + freshness window   (parameter)
live            = now < expires_at
```

### Two independent signals, two jobs

- **Expiry governs liveness.** Window closes, the item disappears. "Fresh or hidden" intact.
- **Estimate debt governs annotation.** It never hides anything; it marks whether the figure was *weighed* or *estimated*, and past a threshold it raises a farmer-facing prompt to go do a stocktake. The threshold is a parameter, so the founder's *how wrong is too wrong* answer is a config value rather than a redesign.

A buyer therefore sees `50.6 lb · weighed · confirmed today` or `~25 lb · estimated · confirmed 2 days ago`, and never sees a lapsed item at all.

### What falls out without further decisions

- **Window granularity.** A window is a per-movement field; "this week" is not structurally special. "About 30 pounds ready next week" is a `forecast`-state movement on a later window — which is exactly the founder's unconfirmed column, arriving for free.
- **Expiry mechanism.** Computed on read for display, so there are no moving parts in the common path. A scheduled pass is needed anyway because the expiry nudge has to fire on lapse — and [Is BreadBasket a persistent brain or a web app?](23-agent-runtime-shape.md) already provides the durable layer to run it.
- **Flatness.** The movement is flat apart from `amount` and `window`, both one level deep. It satisfies the extraction constraint from [Structured extraction with the AI SDK](04-structured-extraction.md) without needing a separate storage shape — no translation layer, no translation bugs.
- **Uncertainty.** Not stored as a range. `measured: false` plus accumulated `estimate_debt` carries it. Trying to be precise about imprecision is a trap; tracking that it is compounding is tractable.

### The omission question — dissolved, not decided

The founder question we most wanted to avoid guessing at was whether an unmentioned item means *sold out* or *forgot*. In a ledger it means **neither: no movement, so the balance stands.** "Sold out" becomes an explicit movement he makes, not an inference drawn from silence. The freshness window is the safety net for a balance nobody has touched.

`session.covered` survives anyway — a session that claims to cover the whole farm is a stronger statement than one adding a single product, and the read-back can behave differently. But it is no longer load-bearing for correctness.

### Why `source` is not optional

Ordering is out of scope, but the founder raised the case that matters: he could be accruing online or bulk restaurant sales and **not realise his tomatoes are gone**. In a ledger that is a `remove` movement with `source: order` — the balance drops without him touching anything and the arithmetic still reconstructs. The field costs nothing now; adding it later is a migration of the one table that matters.

Two consequences recorded elsewhere: it carves an exception into north-star principle 3, and it names **overselling** as a distinct failure mode.

## Superseded framing

Earlier in this map, availability was described as "a snapshot with per-product freshness." That is amended: a check-in is **either a true-up or a set of deltas**, and periodic full reconciliation replaces the idea of a wholesale weekly picture. Per-product freshness is unchanged and still correct.
