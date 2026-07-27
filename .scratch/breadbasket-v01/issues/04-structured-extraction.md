# Structured extraction with the AI SDK

Type: research
Status: resolved
Audience: us
Blocked by: —

## Question

What does the AI SDK actually give us for turning free-form farmer speech into a structured snapshot, in this repo's Next.js version?

## Answer

Resolved by a research memo: [Framework, Model & Provider Recommendation Memo](../research/framework-model-provider-memo.md). Findings only — the choices it recommends belong to [The v0.1 model and provider stack](16-model-and-provider-stack.md), not here.

**The facts that matter:**

- Structured output is reached through `generateObject` / `Output.object()` with a Zod schema, which delegates to each provider's native strict-schema mode. Plain JSON mode carries a 2–5% schema-mismatch rate and should not be used.
- **Keep the snapshot schema flat.** Compliance degrades measurably at 3–4+ levels of nesting across providers. This is a hard constraint on [The availability record shape](01-availability-record-shape.md) and [The normalisation target shape](06-normalisation-target-shape.md) — the window/state/quantity fields must not nest deeply.
- Partial and uncertain extraction is handled by a **validate-and-retry wrapper**: Zod parse, one reprompt on failure. There is no provider-native "I'm unsure about this field" primitive — uncertainty must be modelled in the schema itself if we want it.
- **Schema-valid is not semantically correct.** Every source agrees the read-back-and-confirm loop is the actual safeguard. This is independent support for the confirm-before-publish design already settled.
- Anthropic's supported JSON Schema subset **excludes numeric constraints** (`minimum`/`maximum`/`multipleOf`) and string length constraints. This directly constrains the quantity field, where bounds would otherwise be the obvious move.
- The AI SDK v6 ships `transcribe`/`generateSpeech` behind the same provider-adapter pattern, so v0.2 voice providers are drop-in **if** the seam in [The channel adapter seam](08-channel-adapter-seam.md) holds.

**Corrections to the memo** (recorded in full in the verification addendum): its Anthropic lineup omits Claude Opus 5 and Fable 5; Haiku 4.5's context is 200K not 1M; Haiku 4.5 does not support the `effort` parameter and uses the older thinking API; and its two structured-output claims about Anthropic are wrong — Anthropic has native structured outputs and strict tool use, and strict mode *does* require `additionalProperties: false`.

**Unverified against this repo.** The AI SDK is not installed (`next@16.2.11`, `react@19.2.4`, no `ai` package). Every SDK API claim must be checked against the installed version and `node_modules/next/dist/docs/` before it reaches code.
