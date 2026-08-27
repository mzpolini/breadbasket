# 1. A harvest cadence is one standing rule, not generated forecast entries

Date: 2026-08-27

## Status

Accepted

## Context

The first beta broke on "twenty pounds of watermelon every week through September." The ledger already supports discrete `forecast` movements with a window, so the cheapest-looking fix was to expand the sentence into one forecast movement per week at publish time.

That reuse is a trap. The ledger is append-only; six generated rows have no link to each other, so "make it fifteen" or "watermelon's done" means superseding six things individually. It also writes forecasts into the ledger before anything has grown, blurring the one line the product exists to hold: a forecast is never stock.

## Decision

A cadence is stored once as a **harvest rule** — crop, expected amount, interval, optional start, optional end — with the farmer's sentence kept verbatim. Rules are append-only; a change or an end is a new rule that supersedes the old, newest wins.

Rules never generate ledger rows. The farm stand's "coming soon" reads rules directly, as the farmer's sentence. The ledger only receives an on-hand movement when the farmer confirms a real harvest at check-in. A rule is flagged by the same freshness window as stock when the farmer hasn't spoken about the crop.

For the POC only "weekly" is structured. Any other cadence is stored verbatim on the rule and shown to the founder as a callout rather than parsed.

## Consequences

- One row to supersede, so reversing or reshaping a cadence is cheap.
- The ledger stays a record of things that exist; `forecast` movements remain for one-off dated claims (a market day), not recurrence.
- "Coming soon" can never be mistaken for availability, because it is rendered from a different concept.
- Reconciliation is a conversation, not arithmetic: a missed week writes nothing and is simply asked about at the next check-in.
- We accept that customers see a sentence rather than a computed next date. A date we cannot stand behind is worse than none.
