# Offline and queued movements

Type: grilling
Status: open
Audience: us
Blocked by: —

## Question

Surfaced by the design, which treats bad signal as **the normal case** rather than an edge: *"Held on your phone."* · *"No signal out here. It goes up by itself the moment you have bars — you can put the phone away."* · *"held 81 min"* · *"Written while you had no signal — went up at 8:31am when you hit the road."*

We have nothing. No queue, no local persistence, no sync, no queued state on a movement.

- Where does an unsent movement **live** — and does the ledger need a `queued` state, or is that strictly a client concern the domain never sees?
- What does he **see** while it is held? The design shows an explicit "held on your phone" state rather than a spinner or a silent failure.
- What happens if he keeps talking into a dead connection? The design lets him, and delivers the read-back late — *"I've got your words saved. I'll read them back when there's signal."*
- **Nothing publishes unconfirmed.** So a queued exchange is queued *before* the read-back, which means the confirm step happens when signal returns, not before. Is that right?
- Conflict on reconnect: two devices, or a long gap. Probably not real at n=1, but the answer shapes whether queued movements are ordered by client time or server time — and `occurredAt` ordering is already load-bearing in the fold.

## Why it is the largest gap

**The notebook always works.** That was named as the incumbent's strongest advantage when success criteria were set, and an app that fails in a field with no bars loses to paper on the one axis most likely to decide the pilot. Everything else we have built is a refinement; this is table stakes we do not have.

## Constraint

Read `node_modules/next/dist/docs/` before assuming anything about what this Next version offers for offline or background sync.
