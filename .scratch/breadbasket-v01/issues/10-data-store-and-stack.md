# Where availability data lives

Type: grilling
Status: open
Audience: us
Blocked by: —

## Question

Given the record shape, where does it live and what runs it?

- What **store** fits? Snapshots with derived expiry and an append-ish history are not demanding, but provenance and later multi-source ingestion argue against painting into a corner.
- Does history need to be **retained**? Keeping past snapshots costs little and would let us answer "was this true when they drove out?" — which is the incident the product exists to prevent.
- How does expiry actually **happen** — computed on read, or swept on a schedule? Computed-on-read has no moving parts; a sweep is needed anyway if a nudge fires on lapse.
- Where does the app **run**, and what does that imply for scheduled work?
- What does the founder's secret-URL identity need from the store?

## Settled upstream

[Is BreadBasket a persistent brain or a web app?](23-agent-runtime-shape.md) fixed two things this ticket must honour: the system is **multi-tenant** — a farm is a row, so tenancy belongs in the schema from the start even at n=1 — and **conversation state lives here too**, as serializable channel-agnostic data, not in a provider's session store or a queue payload.

## Prior input

[The research memo](../research/framework-model-provider-memo.md) argues for keeping business state in your own database rather than in a queue payload or a provider's session store, so a later migration stays cheap — and for conversation state being serializable and channel-agnostic. It recommends Inngest for scheduled durable steps over bare Vercel Cron, on retries and step durability. Treat both as input, not as settled; the framework and provider choices belong to [The v0.1 model and provider stack](16-model-and-provider-stack.md).

## Constraint

Load the `marketplace` skill before recommending any external provider — do not hardcode a vendor SDK from memory. Scale is one farm; choose for correctness and reversibility, not throughput.
