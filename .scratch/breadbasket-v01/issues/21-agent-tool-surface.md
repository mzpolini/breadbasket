# The agent's tool surface

Type: grilling
Status: open
Audience: us
Blocked by: —

## Question

How many tools does the pilot agent actually need, and what are they?

This became urgent because the founder wants to *see* the flows, and the plan is to generate UI from tool calls rather than dump JSON — which makes the tool set a **UI contract**, not just an implementation detail. Getting the granularity right matters more than it normally would.

## The straw-man below is stale

It was written when availability was a snapshot. [The availability record shape](01-availability-record-shape.md) has since settled on a **ledger of movements**, so `propose_snapshot` / `commit_snapshot` are the wrong shape — the operations are now movement-shaped: record a delta, record a true-up, correct a movement, read the balance. Rework it before working this ticket. The `trueup` and the estimate-debt stocktake prompt both likely want to be visible operations, since the founder needs to see them.

## Straw-man (stale — react to it, don't accept it)

A first cut at the v0.1 surface — roughly six real tools:

| Tool | Does | Renders as |
|---|---|---|
| `extract_items` | Free text → structured candidate items | The parse: what was heard, per item, with confidence |
| `resolve_product` | Free text term → known product, or flags it unknown | A resolution chip — "greens → collard greens", or "?" |
| `propose_snapshot` | Assemble candidates into a read-back | The read-back card — the core UI object |
| `commit_snapshot` | Publish confirmed items | A published-state confirmation |
| `amend_item` | Correct or drop one line without redoing the rest | An inline diff on one row |
| `get_live_availability` | What is currently published for this farm | The "here's what's live" list |

Plausible additions, each of which should have to argue for itself: `set_freshness` (per-product window), `withdraw_farm` (the takedown action from [Consent, takedown, and data ownership](11-consent-and-takedown.md)), `snooze_nudge`.

## What to settle

- **Granularity.** Six tools or two? A single `update_availability` tool is simpler to build and makes the agent's job easier, but it renders as one opaque box — the founder sees nothing. Fine-grained tools make the flow legible and give the model more ways to get it wrong.
- **Is `extract_items` a tool at all**, or just a structured-output call that isn't part of the agent's tool loop? [Structured extraction with the AI SDK](04-structured-extraction.md) suggests the latter is the natural shape — but then the most interesting step in the whole system is invisible to the founder.
- **What must be a tool for safety** rather than for legibility? `commit_snapshot` publishes to the public view; that is the one irreversible-ish action and probably wants to be explicit and gated.
- Does the tool set assume **synchronous turn-taking**? See [The channel adapter seam](08-channel-adapter-seam.md).

## Why it matters

Tool granularity is normally a private implementation choice. Here it determines what the founder can see, what the UI can render, and how hard v0.2's SMS adapter is. Decide it deliberately.
