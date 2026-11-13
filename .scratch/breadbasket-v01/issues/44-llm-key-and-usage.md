# Dedicated LLM key and per-message usage

Type: spec
Status: ready-for-agent
Audience: us
Blocked by: 31
Parent: 30 · Brief item 7

## What exists

`app/api/chat/route.ts` calls `streamText({ model: 'anthropic/claude-sonnet-5' })` through the Vercel AI Gateway, authenticated by the project's OIDC token. Spend lands on whichever Vercel team owns the project, and nothing is logged per message.

## What to build

**Dedicated key:**

- Create an AI Gateway API key that belongs to Breadbasket only, and set it as `AI_GATEWAY_API_KEY` on production and staging. The SDK prefers it over OIDC.
- Name it per environment, so the gateway's own usage dashboard splits spend by environment.
- If Breadbasket should be billed on an Anthropic account rather than Vercel, use the gateway's bring-your-own-key option with a dedicated Anthropic key. The code doesn't change either way.

**Usage log:**

- New table `llm_usage`: `id`, `farm_id`, `posted_by`, `message_id` (the user turn that triggered the call), `model`, `input_tokens`, `output_tokens`, `cached_input_tokens`, `cost_usd` (nullable), `created_at`.
- Record it in `streamText`'s `onFinish`, from `totalUsage` (summed across tool steps).
- Take cost from the gateway's provider metadata when it's present. Otherwise leave it null; it can be computed later from tokens.
- Await the insert. A failure to log usage must never fail the farmer's turn, so catch the error and log it.

**Reporting:**

- `pnpm usage:report [--since YYYY-MM-DD]` prints tokens and cost per farm.
- The activity log (40) shows per-turn cost.

## Done when

- Every chat turn writes one `llm_usage` row tied to the farm and the person.
- Production calls authenticate with the dedicated key.
