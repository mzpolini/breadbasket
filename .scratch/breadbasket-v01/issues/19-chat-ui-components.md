# Chat UI component options

Type: research
Status: resolved
Audience: us
Blocked by: —

## Answer

Findings: [Chat UI component options](../research/chat-ui-components.md). Facts only — the choice belongs to [The chat surface design](20-chat-surface-design.md).

**The two that matter most:**

- **Tap-to-confirm does not exist ready-made.** No library ships per-item confirm/edit/delete inside a message. The closest real substrate is the AI SDK's **tool-approval state machine** (`needsApproval`, the `approval-requested` / `approval-responded` / `output-denied` part states, `addToolApprovalResponse`) — which is confirm-before-publish as a first-class primitive rather than something bolted on. But it is built and documented for a *single* tool call, not a read-back of eight produce lines. The farmer-facing affordance is DIY on top of any option.
- **Generative UI has a verified current pattern**: match `message.parts[]` on `type: 'tool-${toolName}'` and `state`. That maps cleanly onto the six tools proposed in [The agent's tool surface](21-agent-tool-surface.md), which is good news for [Making the flow visible to the founder](22-generative-ui-flow-visibility.md) — the founder's view and the farmer's view really can be one mechanism at two verbosity levels.

**Copy-in vs dependency:** shadcn's native chat primitives, AI Elements, and `shadcn-chatbot-kit` are all copy-in via the shadcn CLI. `@assistant-ui/react` is a genuine installed dependency — the odd one out given the stated copy-in preference for a surface this central.

**Installed reality:** `ai` is not installed and there is no `components.json` yet. `@ai-sdk/react@4.0.40` and `@assistant-ui/react@0.14.27` are both registry-verified compatible with this repo's React 19.2.4.

**Domain-model leakage:** shadcn's primitives explicitly disclaim owning messages, AI state, transport, or persistence. AI Elements and assistant-ui are both built around a chat/parts data model that is channel-shaped and must stay confined to the chat-PWA adapter — see [The channel adapter seam](08-channel-adapter-seam.md).

**Accessibility:** shadcn-family options sit on Radix/Base UI, but no library makes claims about one-handed use, outdoor glare, or poor signal. That design work is unavoidable whichever way this goes.

**Caveat:** several `@assistant-ui/react` documentation claims are flagged UNVERIFIED in the findings — direct fetches were unreliable. Re-fetch before the design decision leans on them.

## Question

The pilot has to look good, not just work — the founder's first impression of the chat surface is part of what the pilot tests.

[VapiBlocks](https://www.vapiblocks.com/) is the reference point: a library of drop-in components for voice AI interfaces. It is **voice-specific and therefore v0.2**, but the question it prompts is in scope now — what is the equivalent for a chat surface?

Establish, from current primary sources rather than memory:

- What prebuilt chat-UI component libraries exist that work with a Next.js 16 / React 19 / Tailwind 4 app? Check the Vercel/AI SDK ecosystem first, since we are already there.
- Which are **component libraries you own the code of** (copy-in, editable) versus **dependencies you install**? For a surface this central to the product, the first is usually right.
- What do they actually give you — message list, streaming text, tool-call rendering, input affordances, empty and error states?
- What do they assume about the conversation shape, and would those assumptions leak into the domain layer? See [The channel adapter seam](08-channel-adapter-seam.md) — a component library that dictates the message model is a seam violation.
- Do any handle **tap-to-confirm** affordances, which is what our read-back loop needs and what a generic chat box does not have?
- What is the accessibility and mobile story? The farmer is on a phone, possibly outdoors, possibly one-handed.

## Constraint

Load the `vercel:shadcn` skill before evaluating shadcn-based options, and check anything AI-SDK-related against the installed version rather than published blog posts. Facts and trade-offs — the choice belongs to [The chat surface design](20-chat-surface-design.md).

## Output

Findings as a Markdown file in the repo, with a pointer added back to this ticket.

Findings: [Chat UI component options — research findings](../research/chat-ui-components.md)
