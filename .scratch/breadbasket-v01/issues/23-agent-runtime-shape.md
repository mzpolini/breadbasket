# Is BreadBasket a persistent brain or a web app?

Type: grilling
Status: resolved
Audience: us
Blocked by: —

## Answer

**One BreadBasket brain serving many farms, running on serverless with a durable workflow layer.** Not one agent per farm, and not a long-lived process.

**Tenancy — one multi-tenant brain.** A farm is a row, not an instance. This confirms what [The public availability view](09-public-availability-view.md) already assumed, and it makes buyers straightforward to add in v0.2. The cost accepted knowingly: there is no per-farm isolation, "my agent" is a product feeling rather than a literal instance, and the channel plumbing is ours to build rather than inherited.

**Runtime — serverless plus durable orchestration.** Next.js route handlers carry the conversation; a durable layer carries anything that must survive a crash or span turns — the Sunday check-in, expiry sweeps, retries. No server to own, patch, or be paged for. Conversation state and snapshots live in our own database as serializable, channel-agnostic data.

**What this rules out, and why.** OpenClaw and Hermes Agent are both genuinely the "one brain, many channels, always on" shape the question was reaching for — but both are *personal-assistant* architected: one owner, one self-hosted instance. That is a perfect fit for a one-farmer pilot and structurally wrong for a multi-tenant product, which is the trap, because at n=1 the two are indistinguishable. Their **gateway pattern** — channels as connections into one agent — is worth stealing regardless; it is the same idea as [The channel adapter seam](08-channel-adapter-seam.md).

A third consideration weighed against adopting either: their grain runs opposite to the product's. Hermes' headline property is autonomous self-improvement; BreadBasket's founding promise is that it *never publishes a guess*. Building restraint on a framework optimised for autonomy is possible but is a current to swim against.

**What made this decidable.** Serverless is no longer the short-lived request/response box that made a VPS necessary for session-shaped work: Fluid Compute is the default, timeouts default to 300s, WebSockets are supported, and streaming needs no special runtime. **Verify these before they become load-bearing** — that belongs to [The v0.1 model and provider stack](16-model-and-provider-stack.md).

**Honest caveat.** "Always on" here is simulated, not literal. That is fine for a chat surface and for scheduled nudges. Whether it holds when a live phone call arrives is a v0.2 question and is out of scope — but it is the specific assumption that would need re-testing then, rather than the whole architecture.

**Does it redraw the destination?** No. The v0.1 spec for a chat PWA remains the right artifact.

## Question

Two genuinely different architectures have been in play without ever being named:

**A web app that calls a model.** A Next.js route handler receives a message, runs a parse and a read-back, writes to a database, returns. Nothing is running between requests. Scheduled work is a cron job that wakes up, does a thing, and exits. This is what everything on the map has quietly assumed.

**A persistent agent runtime — "the brain".** One long-lived agent with durable sessions and its own memory, always available, fielding whatever arrives on whatever channel: a chat message, a phone call, an SMS, a buyer inquiry. Channels are connections into one always-running thing rather than separate entry points into a stateless app.

This is not the same question as [The channel adapter seam](08-channel-adapter-seam.md) — that asks *where the boundary sits*; this asks *what is on the other side of it*, and whether anything is running at all between turns.

## Why it may be urgent rather than premature

[The research memo](../research/framework-model-provider-memo.md) names **"a synchronous non-streaming request/response shape"** as one of four couplings that would force a v0.2 rewrite. If the destination is a persistent brain, then building v0.1 as a stateless request/response app is precisely the mistake we have been trying to avoid — and the cost of the mistake is paid at exactly the moment voice arrives, because a phone call is a long-lived bidirectional session and a route handler is not.

Against that: a durable agent runtime is a large dependency to take on for one farmer sending a weekly message, and "the brain" can be arrived at incrementally if conversation state is serializable and channel-agnostic from the start — which is already a settled premise.

## What to settle

- Which shape is v0.1 built on? The honest options are: stateless now with serializable state (cheap, some rework risk), durable runtime now (heavier, no rework), or a deliberate thin abstraction (usually the worst of both).
- **What specifically does "always fielding calls, inquiries and SMS" buy that a stateless app plus a queue does not?** Name the concrete capability — cross-channel memory, mid-task interruption, long-running work between turns, proactive outreach — rather than the vibe. If nothing on that list is needed in v0.1, the answer is probably "not yet, but keep state serializable".
- Does the answer **redraw the destination**? If BreadBasket is fundamentally an always-on agent, a v0.1 spec for a chat PWA may be planning the wrong artifact — and this map should be re-charted rather than patched.

## Candidates to evaluate (verify, do not assume)

The user raised "openclawd" and "hermes" — **neither has been identified**; the names need confirming before either can be assessed, and nothing about them should be assumed. Two candidates in the stack this project already sits in are worth checking against whatever those turn out to be:

- **Eve** — a filesystem-first framework for durable AI agents, offering durable sessions, connections, channels, subagents, schedules, and evals. Shape matches "the brain" closely. Read the installed docs rather than blog posts; propose before scaffolding.
- **Vercel Chat SDK** — one codebase across multiple chat platforms, with threads, messages, and state management. Solves multi-channel, not durability.

Load the relevant skills before assessing either. Do not install anything to answer this.

## Constraint

This ticket decides an architecture, not a vendor. If it turns into a framework bake-off, it has gone wrong — the framework choice belongs to [The v0.1 model and provider stack](16-model-and-provider-stack.md).
