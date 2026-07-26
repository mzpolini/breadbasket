# What the availability states mean to a farmer

Type: grilling
Status: open
Audience: founder
Blocked by: —

## Question

Split out of [The availability record shape](01-availability-record-shape.md). These are the parts of the record that encode how farming actually works — a developer cannot answer them by reasoning, and getting them wrong produces a system that is internally consistent and wrong about the world.

Push him on these. He is technical enough to think about them structurally, and the cost of a wrong answer here is a schema migration later.

- **Omission.** He sends a new week's picture and does not mention tomatoes. Does that mean *sold out*, *forgot*, or *unchanged from last week*? What would he expect to happen? Silently lapsing them risks hiding real food; carrying them forward risks lying. Should the agent ask, and does asking every week become the friction we are trying to remove?
- **What actually happens to produce**, in the states we would model. Does something go from available to gone in one step, or is there a "nearly out" that matters to a buyer? Does anything come *back* after being gone — a second picking, a field that recovers?
*(Dropped: "withdrawal vs sold out" — takedown left v0.1 scope, and "sold out" is now simply a `remove` movement he makes, so there is nothing to distinguish.)*
- **"100 confirmed, 200 unconfirmed."** 300 total, or a 200 forecast of which 100 are now confirmed? And if he forecast 200 and confirms 100, is the other 100 still unconfirmed, or superseded?
- **How wrong is too wrong?** If the system says 50lbs and there are 40, has it lied? What size of error would make a buyer stop trusting it?

  This is now a **concrete parameter**, not an abstract question. [The availability record shape](01-availability-record-shape.md) tracks whether each figure was weighed or estimated, and accumulates "estimate debt" as guesses pile up. Past a threshold, it prompts him to go weigh something. **He sets that threshold** — how many estimates, or how much drift, before the number stops being worth publishing. Ask it in those terms; he'll have a better instinct for it than either of us.

- **Omission is no longer a question for him.** The ledger made silence mean *no movement*, so an unmentioned item's balance simply stands until its freshness window closes. Don't ask.

## What is NOT in this ticket

Field names, nesting, how expiry is computed, how provenance is stored, state-machine mechanics. Those are engineering choices that stay in [The availability record shape](01-availability-record-shape.md) and do not need him.
