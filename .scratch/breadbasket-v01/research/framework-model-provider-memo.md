# BreadBasket v0.1: Framework, Model & Provider Recommendation Memo

Research asset for [Structured extraction with the AI SDK](../issues/04-structured-extraction.md). Received July 2026.

**Read the verification addendum at the bottom before acting on the Anthropic figures.**

---

## TL;DR
- **Build v0.1 on the Vercel AI SDK (v6) used directly, with a two-model split — Gemini 2.5 Flash-Lite ($0.10/$0.40 per 1M tokens) as the cheap structured parser and Claude Haiku 4.5 ($1/$5 per 1M) as the conversational read-back — behind direct provider keys, with Inngest for scheduled per-crop check-ins.** Skip Mastra, LangGraph JS, and the OpenAI Agents SDK at n=1; add à-la-carte tracing (Langfuse) and evals (Promptfoo) rather than adopting a heavier framework.
- **Structured-output reliability, the #1 property, is best served by native strict-schema modes (OpenAI Structured Outputs ~99.9%, Claude tool-use ~99.8%, Gemini response_schema ~99.7% schema compliance) surfaced through the AI SDK's `generateObject`/`Output.object()` with a Zod schema and a validate-and-retry wrapper.** Do NOT rely on plain JSON mode (2–5% schema mismatch), and keep the snapshot schema flat.
- **The single biggest risk to these specific users (Black farmers in the US South) is voice STT accuracy in v0.2, not framework choice.** Keep the domain model transport-agnostic now and voice stays cheap to add; the decisions that would force a rewrite are coupling state to the browser, to a single provider's session store, or to a synchronous request/response shape.

## Key Findings

### 1. Framework layer — recommendation: Vercel AI SDK direct

- The AI SDK is a TypeScript-native, provider-agnostic toolkit with `generateObject`/`streamObject`/`Output.object()` for Zod-schema structured output across 100+ models, first-class streaming, and (as of v6) first-class `generateSpeech`/`transcribe` audio primitives. Its `generateObject`/`Output.object()` functions accept a Zod schema and use each model's native structured-output mode (JSON/schema mode for OpenAI and Gemini, tool-use extraction for Anthropic) to constrain output to the schema shape.
- **Mastra** builds *on top of* the AI SDK and adds an Agent class, graph-based workflows, first-class memory (Postgres/Upstash/LibSQL), evals, and tracing. v1.0 on Jan 21, 2026; ~26k GitHub stars; 300k+ weekly npm downloads; **$22M Series A led by Spark Capital on April 9, 2026, $35M total**. Production use at **Brex, Marsh McLennan, Indeed, Sanity, Replit**. Genuinely good — "Rails for agents" — but its value is durable workflows + pluggable memory + evals *bundled*. At n=1 with no multi-agent orchestration and no RAG, that is a fast-moving abstraction layer bought for features you can add individually.
- **LangGraph JS** — graph-based, powerful for complex stateful multi-agent workflows, but the TS port trails Python by 4–8 weeks per release and carries Python idioms into a Next.js codebase. Overkill for a single conversational agent.
- **OpenAI Agents SDK (TS)** — thin, four-lines-to-an-agent (~18,900 stars, v0.10.2) but ties state persistence to OpenAI's thread storage and is happiest single-provider — directly at odds with the provider-swap and two-model requirements.
- **Plain provider SDK + hand-rolled loop** — maximum control, but re-implements schema formatting per provider, streaming, and retry.

| Criterion | Vercel AI SDK (direct) ✅ | Mastra | LangGraph JS | OpenAI Agents SDK | Plain SDK + loop |
|---|---|---|---|---|---|
| Structured output (Zod/JSON schema) | Excellent — native | Excellent (uses AI SDK) | Good | Good (OpenAI-native) | Manual per provider |
| Multi-turn state | You own it (simple, portable) | First-class memory | First-class (graph state) | OpenAI thread store (lock-in) | You own it |
| Provider swap-ability | Excellent | Excellent | Good | Poor | Manual |
| Scheduled/durable workflows | Pair w/ Inngest/Trigger.dev | Built-in | Built-in checkpointing | None | Pair w/ Inngest |
| TypeScript quality | Excellent | Excellent | Good (Python-lagging) | Good | N/A |
| Maintenance velocity | Very high (Vercel) | Very high (~weekly) | High (Python-first) | Moderate | N/A |
| Grows into SMS/voice adapter | Clean (v6 audio primitives) | Clean | Clean | Awkward | You build it |
| **Fit for BreadBasket v0.1** | **Best** | Over-provisioned | Over-provisioned | Mismatched | Too much undifferentiated work |

### 2. Model strategy — two-model split wins

Small/mid-tier pricing (per 1M tokens, list, as stated July 2026):

| Model | Input | Output | Notes |
|---|---|---|---|
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | ~231 tok/s, 0.30s TTFT; cheapest capable multimodal; 1M context |
| Gemini 2.5 Flash | $0.15 | $1.25 | higher quality, still cheap |
| GPT-5 nano | $0.05 | $0.40 | fastest/cheapest OpenAI; classification/extraction |
| GPT-5 mini | $0.125–0.25 | $1.00 | ~101 tok/s, 0.69s TTFT |
| GPT-5.4 mini | $0.75 | $4.50 | newer, stronger |
| GPT-5.4 nano | $0.20 | $1.25 | 400k context |
| Claude Haiku 4.5 | $1.00 | $5.00 | ~94 tok/s, 0.72s TTFT; best instruction-following in budget tier |

- **Structured-output reliability in practice:** OpenAI Structured Outputs ~99.9%, Claude tool-use ~99.8%, Gemini response_schema ~99.7% (per TokenMix.ai testing); plain JSON mode 2–5% mismatch. Gemini/Claude degrade to ~1–2% failure at 3–4+ levels of nesting — **keep the availability-snapshot schema flat**.
- **Parser/normalization:** Gemini 2.5 Flash-Lite is strongest per-dollar and per-ms. GPT-5 nano is a viable fallback.
- **Conversational read-back:** Claude Haiku 4.5 — best-in-budget instruction-following and natural phrasing. Gemini 2.5 Flash is the cheaper single-vendor fallback.
- **Does the split beat one mid-tier model?** Yes: the parser call is high-volume, latency-critical, schema-bound; the read-back is lower-volume and quality-sensitive. A single mid-tier model is the simpler fallback if operational simplicity outweighs pennies.
- **Eval set for messy spoken input:** seed a golden dataset from real farmer voice-memo transcripts. Hand-label the correct structured snapshot per transcript. Include hard cases: hedged quantities ("maybe 30 lbs"), future-dated claims ("done with tomatoes til next month"), farmer-specific units (bushels, flats, "a mess of"), multiple products per utterance, negations. Score with exact-match on structured fields plus LLM-as-judge for read-back faithfulness. **Promptfoo** (free, OSS, YAML/CLI, runs in CI) first; add **Braintrust** free tier for hosted regression tracking later.

### 3. Provider/routing layer — direct keys for v0.1

- **Direct provider keys** are the sensible v0.1 posture: zero added latency, no extra failure surface, full access to native strict-schema features.
- **Gateways** buy fallback/failover, unified billing, one-key model swapping at a small latency cost. **OpenRouter** adds ~15ms (own docs) up to ~40–70ms (independent studies) routing overhead, no token markup, "Response Healing" that fixes JSON *syntax* (not schema) errors on non-streaming requests only. **Vercel AI Gateway** passes through provider list prices with no markup (team controls like ZDR/allowlists cost $0.10 per 1,000 successful requests), integrates natively with the AI SDK, supports provider `order`/`only`/`sort`, automatic failover, service tiers, $5/month free credit.
- **Structured-output caveat with gateways:** provider feature parity varies; strict schema enforcement depends on the underlying route. Where structured-output reliability is paramount, direct keys avoid ambiguity.
- **v0.1 posture:** direct Anthropic + Google keys behind the AI SDK, with env-var/feature-flag indirection so switching to the Vercel Gateway later is a config change, not a rewrite.

### 4. Voice readiness (awareness only — v0.2)

- **Landscape:** STT — **Deepgram Nova-3** ($0.0043/min batch, $0.0077/min streaming, 200–300ms streaming latency, $200 free credit ≈ 45,000 min) is the latency/cost leader; **AssemblyAI Universal-3 Pro** (~$0.0075/min streaming); Whisper-family (self-host); **Speechmatics** (accent/dialect robustness leader). TTS — **Cartesia Sonic** (~40–90ms TTFA, ~30–40% cheaper than ElevenLabs), **ElevenLabs** (~75ms Flash v2.5), OpenAI, Deepgram Aura-2, Hume Octave. Integrated realtime — OpenAI Realtime API, **Pipecat** (OSS, v1.0 April 2026), **LiveKit Agents**, **Vapi & Retell** (managed, fastest to a phone number), Twilio (transport). Rule of thumb: managed under ~10k min/month; self-host above ~50k; governing constraint is a ~300–500ms turn-latency budget across STT→LLM→TTS.
- **Rural phone audio + AAVE/Southern speech — the critical accuracy issue for these users:** peer-reviewed **Koenecke et al., PNAS 2020 (117(14):7684–7689)** found "all five ASR systems exhibited substantial racial disparities, with an average word error rate (WER) of 0.35 for black speakers compared with 0.19 for white speakers" — best system Microsoft 0.27 vs 0.15, worst Apple 0.45 vs 0.23, across Amazon, Apple, Google, IBM, Microsoft. Disparity worst for African American men and heavier AAVE users, with over 20% of Black samples effectively useless vs under 2% for white. CORAAL benchmarks show **rural Southern AAE is the hardest subset**: per arXiv:2205.08014, wav2vec 2.0 baseline WER was 24.7% for CORAAL Princeville, NC vs 17.5% Atlanta and 16.6% DC. **Speechmatics claims (vendor marketing)** 82.8% accuracy for African American voices vs Google 68.6% and Amazon 68.6% — "a 45% reduction in errors" — based on Stanford's "Racial Disparities in Speech Recognition" datasets (press release, Nov 2021). Phone audio (8kHz, noisy, rural connectivity) compounds all of this.
  **Implication:** whichever STT is picked in v0.2, eval on your own farmers' audio, keep the confirm-back-before-publish UX as an accuracy safety net, and shortlist Speechmatics, AssemblyAI, and Deepgram head-to-head on real recordings — vendor-neutral leaderboards do NOT publish race/AAVE breakdowns.
- **Decisions NOW that keep voice cheap later:** (1) domain model transport-agnostic — snapshot-normalization logic imports nothing browser-specific; (2) conversation state serializable and channel-agnostic in your own DB, not React state or a provider thread ID; (3) agent loop designed around a streaming text interface a voice adapter can wrap; (4) turns short and confirm-oriented; (5) AI SDK v6 ships `transcribe`/`generateSpeech` behind the same provider-adapter pattern, so voice providers are drop-in.
- **Decisions that would force a rewrite:** coupling state to the browser or to a provider thread store; a synchronous non-streaming request/response shape; hard-coding a single provider's raw SDK; embedding channel assumptions (chat markdown, buttons) into the domain layer.

## Details

### Scheduled check-ins & durable state

Per-crop proactive cadence needs scheduled + durable execution. **Inngest** is the lowest-friction serverless default with first-class Vercel support: cron triggers, automatic retries, concurrency control, step-level durability, observability, all in TypeScript. **Trigger.dev v3** is the OSS/self-host alternative with Bun-based long-running workers. For n=1, Inngest's zero-config Vercel integration wins; keep business state in your own database (not the queue payload) so a later migration stays cheap. Vercel Cron alone is viable for the simplest cadence but lacks retries/durability.

### Rough monthly cost at pilot scale (one farmer)

Token costs are effectively rounding error. A typical exchange (parse + read-back) is ~1–2k input + a few hundred output tokens; even hundreds of exchanges/month cost well under $1. Dominant costs are platform: Vercel (Hobby free / Pro $20/mo), Inngest (free tier covers a pilot), Langfuse (free/self-host), Promptfoo (free). **Realistic v0.1 pilot: ~$0–20/month.**

## Recommendations

**Build this month (v0.1 stack):**

1. **Framework:** Vercel AI SDK v6, used directly, in the Next.js PWA. Parsing through `generateObject`/`Output.object()`, read-back through `streamText`.
2. **Parser model:** Gemini 2.5 Flash-Lite with `response_schema` / Zod, a FLAT schema, and a validate-and-retry wrapper (Zod parse → one reprompt on failure). Fallback: GPT-5 nano.
3. **Conversational model:** Claude Haiku 4.5. Fallback: Gemini 2.5 Flash.
4. **Provider layer:** Direct Anthropic + Google API keys behind an env-var indirection. No gateway yet.
5. **Scheduling/durability:** Inngest (cron + durable steps). Persist snapshots and conversation state in your own DB (Postgres/LibSQL) as channel-agnostic serializable data.
6. **Evals:** Promptfoo now, seeded from voice-memo transcripts; Braintrust free tier when regression tracking is wanted.
7. **Observability:** Langfuse (free/self-host) for tracing — add when convenient, not blocking.

**Voice-readiness checklist (decide now, build in v0.2):**

- [ ] Domain model (snapshot normalization, confirm/publish) has zero transport/browser imports.
- [ ] Conversation state is serializable, channel-agnostic, in your own DB.
- [ ] Agent exposes a streaming text interface a voice adapter can wrap.
- [ ] Turns stay short and confirm-oriented.
- [ ] Collect and store real farmer audio now to build an STT eval set.
- [ ] Shortlist Speechmatics + AssemblyAI + Deepgram head-to-head on YOUR farmers' audio.
- [ ] Keep confirm-back UX as an accuracy safety net.

**Thresholds that change the recommendation:**

- **Stay on this stack** at n=1–10 farmers, single agent, chat-only.
- **Adopt the Vercel AI Gateway** when cross-provider failover is needed — config change, not a rewrite.
- **Graduate to Mastra** if v0.3+ introduces multi-agent orchestration, RAG, or complex branching workflows.
- **Move parsing to a mid-tier single model** if the split creates operational friction outweighing token savings.
- **Re-open the STT decision** the moment a v0.2 eval on real farmer audio shows any candidate exceeding ~15% WER on the hardest speakers.

## Caveats (as stated in the memo)

- **Model names/prices move monthly.** Re-verify exact model IDs and rates before wiring keys. Gemini 2.0 Flash/Flash-Lite were deprecated and shut down June 1, 2026 — start on 2.5 Flash-Lite.
- **Structured-output compliance figures** (99.7–99.9%) come from vendor and third-party testing and vary by schema complexity; directional only. Schema-valid output can still be semantically wrong — the confirm-back step is the real safeguard.
- **STT disparity figures:** Koenecke 2020 is independent/peer-reviewed (PNAS); CORAAL city-level numbers are academic (arXiv:2205.08014); Speechmatics' 45% claim is vendor marketing.
- **Latency numbers** are from aggregators and vary by region/load.
- Some framework comparison sources are vendor blogs with a point of view.

---

# Verification addendum

Checked against the authoritative Anthropic model reference and this repo, at the time of recording. Four corrections; the memo's core recommendation survives all of them.

**1. The Anthropic lineup in the memo is incomplete.** It lists Haiku 4.5, Sonnet 4.6/Sonnet 5, and Opus 4.7/4.8, but omits **Claude Opus 5** ($5/$25 — the current Opus, a drop-in at Opus 4.8's pricing) and **Claude Fable 5** ($10/$50). Neither belongs in a budget-tier read-back, so this does not change the recommendation — but a spec that describes the lineup should not describe it from this memo.

**2. Haiku 4.5's pricing is right; its context window is not 1M.** $1/$5 confirmed. Context is **200K**, max output **64K** — every other current model is 1M/128K. Irrelevant at a one-farmer conversation length, but do not carry a 1M assumption into the design.

**3. Haiku 4.5 does not support the `effort` parameter, and uses the older thinking API.** `effort` errors on Haiku 4.5, and thinking is `{type: "enabled", budget_tokens: N}` rather than adaptive. If the read-back design ever wants effort control or adaptive thinking, that is an argument for a different model — not something to discover mid-build.

**4. Two structured-output claims are wrong.**
   - The memo says Anthropic is reached via "tool-use extraction." Anthropic now has **native structured outputs** (`output_config: {format: {...}}`) and **strict tool use** (`strict: true`), and **Haiku 4.5 supports both**. Constraining the parser to a schema on Anthropic no longer requires going through a tool.
   - The memo says "Claude's tool-use schema doesn't require `additionalProperties: false`, making optional fields easier than OpenAI's strict mode." Anthropic **strict** tool use *does* require `additionalProperties: false` plus `required`. The claimed ergonomic advantage does not exist in strict mode.

**Also worth knowing:** Anthropic's supported JSON Schema subset excludes recursive schemas, numeric constraints (`minimum`/`maximum`/`multipleOf`), and string constraints (`minLength`/`maxLength`). The AI SDK's Zod path strips unsupported constraints and validates them client-side. This reinforces the memo's "keep the schema flat" advice for an independent reason — and it directly constrains the quantity field, which is exactly where numeric bounds would be tempting.

**Repo facts (checked):** `next@16.2.11`, `react@19.2.4`, TypeScript 5, Tailwind 4. The AI SDK is **not installed** — no `ai` package in `node_modules`. Every AI SDK v6 API claim in the memo is unverified against this repo and must be checked against `node_modules/next/dist/docs/` and the installed SDK before it reaches code.
