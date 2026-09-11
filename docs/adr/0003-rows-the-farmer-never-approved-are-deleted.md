# 3. Rows the farmer never approved are deleted, not compensated

Date: 2026-09-11

## Status

Accepted

## Context

The ledger is append-only, and there is deliberately no update and no delete: a correction is a new movement. That promise is what lets the system answer "what did we claim, and when".

A client bug broke the other half of the promise. The spoken-yes relay replayed historical publish signals after a remount and wrote a read-back the farmer had **corrected and never approved** — nine times, under one proposal id, minutes after the conversation had moved on. The same signature appears earlier in the data at five.

Append-only is a promise about *his claims*. These rows are not claims; they are our defect writing into his record. Compensating them with further movements would preserve the letter of the rule and leave the farmer's history saying he told us something he never said.

## Decision

Movements written without an approval are **deleted**, identified by the proposal id of a read-back that was never published. Nothing else is ever deleted: anything the farmer actually said is corrected forward, by a new movement, as before.

Going forward a uniqueness constraint on `(farm_id, proposal_id)` makes the duplicate class impossible regardless of what any client does, and a superseded read-back is marked dead so a later "yes" can never land on it.

## Consequences

- "Append-only" now reads precisely: append-only for claims the farmer made.
- Deletion needs evidence, not judgement — a proposal id with no approval behind it. Without the read-back provenance on each movement this decision could not be made safely.
- The constraint, not this ADR, is what stops it happening again. The deletion is cleanup; the guard is the fix.
