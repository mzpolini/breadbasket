# Admin: activity log

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 31
Parent: 30 · Brief item 4.4 (the main debugging tool)

## What to build

`/admin/farms/[farmId]/activity`, newest first and paginated by `seq`. Each entry is one user turn and what came of it:

- **Who and when:** `posted_by`, resolved to an email, plus `created_at`.
- **What they sent:** the user message text, verbatim.
- **What Breadbasket understood:** the read-back cards in the assistant turns that followed. These are the tool parts in `messages.parts`, rendered with each proposal's movements or rules in plain rows: product, kind, amount, unit, reason, window.
- **What happened to each read-back:**
  - *published*: there is a `published_proposals` row. Show the movements and rules written under that `proposal_id`.
  - *superseded*: a newer card exists.
  - *never approved*.
- **Direct writes:** stock-screen button writes (movements with no proposal) appear as their own entries.
- **Cost:** tokens and cost for the turn, once 44 lands.

Build the log by joining tables that already exist. No new log table: the transcript, the ledger and the published guard already hold everything. Put the assembly in a pure function (`lib/activity`) so it can be tested with fixture rows.

Add a filter by person. Include raw JSON of the parts behind a disclosure, for the cases where the rendering hides the bug.

## Done when

An admin can see what a given person posted and how it was parsed, all the way through to the rows it wrote.
