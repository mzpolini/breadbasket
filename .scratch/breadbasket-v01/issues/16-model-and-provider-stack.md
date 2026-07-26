# The v0.1 model and provider stack

Type: grilling
Status: open
Audience: us
Blocked by: —

## Question

[The research memo](../research/framework-model-provider-memo.md) recommends a specific stack. Accept it, amend it, or reject it — and record why.

Its recommendation: Vercel AI SDK v6 used directly (not Mastra, not LangGraph, not the OpenAI Agents SDK); a two-model split with a cheap schema-bound parser and a better conversational model for the read-back; direct provider keys behind env-var indirection rather than a gateway; Inngest for scheduled durable steps.

- Is the **two-model split** worth it at n=1? The memo concedes a single mid-tier model is the simpler fallback and that token cost is a rounding error here. The split's real argument is fit-per-job, not price — does that hold when the whole system serves one farmer?
- Which **specific models**, by exact current ID? The memo's own caveat says re-verify before wiring keys, and the verification addendum found four errors in its Anthropic figures. Do not carry model IDs or prices from the memo into the spec unchecked.
- **Direct keys or gateway?** ~~The memo argues direct for strict-schema fidelity.~~ **Stated preference: use the Vercel AI Gateway for now** (developer's call). The memo's contrary recommendation is superseded as a preference — but its *reason* is not resolved; see the verification item below.

  Established from the AI Gateway docs and this repo:
  - The project **is** linked to Vercel (`.vercel` present), so the Gateway is a config step, not an infrastructure decision.
  - **BYOK is supported at zero markup** — bring an Anthropic key, or any other provider's, and pay provider list price. Vercel-managed keys are the same price.
  - **OIDC is the default auth**, not an API key: `vercel env pull` provisions a short-lived `VERCEL_OIDC_TOKEN`, auto-refreshed on deployments. `AI_GATEWAY_API_KEY` is the static fallback for CI or non-Vercel environments. So local dev may need no provider keys at all.
  - `order` / `only` / `models` give provider failover, which matters for a weekly check-in that must not silently fail.
  - `user` and `tags` map cleanly onto multi-tenancy and per-farm cost attribution later.

  **Gotcha to carry into the spec:** Gateway model slugs use **dots**, not hyphens — `anthropic/claude-haiku-4.5`, not the direct-API form `claude-haiku-4-5`. The two ID formats are not interchangeable. Do not hardcode either; call `gateway.getAvailableModels()` and pick from what it returns.

- **UNRESOLVED, and it is the one that matters: does strict/native structured-output schema enforcement behave identically through the Gateway on the chosen route?** Tool calling is standard AI SDK surface and routes fine — that part of the worry is unfounded. But [Structured extraction with the AI SDK](04-structured-extraction.md) established that our extraction correctness rests on each provider's *native strict-schema mode*, and the Gateway docs are explicit that provider-specific features not exposed through the gateway are a reason to use a direct SDK. Verify `generateObject` schema-compliance behaviour on the actual route before committing. Keep the env-var indirection so dropping to direct keys stays a config change.
- **Framework:** is "AI SDK direct" right, given we have no multi-agent orchestration and no RAG? The memo's Mastra case is real but explicitly over-provisioned for n=1.
- **The durable execution layer.** [Is BreadBasket a persistent brain or a web app?](23-agent-runtime-shape.md) settled that there *is* one; this ticket picks it. Candidates include Vercel Workflow (in-ecosystem, durable steps with pause/resume), Inngest (the memo's recommendation), and Trigger.dev. Weigh it as a dependency, not a default.
- **Verify the serverless capability claims** the runtime decision leaned on, before they become load-bearing: Fluid Compute as default, 300s default timeout, WebSocket support, streaming without a special runtime. If any is wrong, the runtime decision deserves revisiting.
- **Scheduling:** Inngest vs Vercel Cron. Note this is the *scheduler*, which is a different question from *how the nudge reaches the farmer* — see [How the Sunday ping reaches the farmer](14-nudge-channel-decision.md).

## Constraint

Load the `marketplace` skill before recommending any external provider, and the `vercel:ai-sdk` skill before committing to AI SDK specifics. Verify model IDs and pricing against current sources — not from the memo, and not from memory.
