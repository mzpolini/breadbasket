# Chat UI component options — research findings

Ticket: [Chat UI component options](../issues/19-chat-ui-components.md)
Feeds: [The chat surface design](../issues/20-chat-surface-design.md) (decision), [Making the flow visible to the founder](../issues/22-generative-ui-flow-visibility.md), [The agent's tool surface](../issues/21-agent-tool-surface.md), [The channel adapter seam](../issues/08-channel-adapter-seam.md)

No recommendation is made here. This is facts and trade-offs only, gathered from primary sources (official docs, npm registry, GitHub repos, the installed toolchain) on 2026-07-25. Where a claim could not be pinned to a primary source, it is marked **UNVERIFIED** rather than stated as fact.

## 0. What's actually installed here (verified against this repo)

Read directly from `package.json` and `node_modules`:

- `next@16.2.11`, `react@19.2.4`, `react-dom@19.2.4`, `tailwindcss@^4` (`@tailwindcss/postcss`), `typescript@^5`.
- **The `ai` package is not installed.** No `ai`, `@ai-sdk/*`, or `@assistant-ui/*` entries in `node_modules` or `package.json`.
- No `components.json` — shadcn/ui has not been initialized in this repo.
- Next's own bundled docs (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) confirm Route Handlers in this version are plain Web `Request`/`Response` — no special streaming API, no Next-specific incompatibility with SDKs that return a streaming `Response` (which is how the AI SDK's chat endpoints work). Cache Components (`use cache`) do not apply to POST handlers (chat endpoints), only opt-in `GET`. **VERIFIED.**

## 1. What genuinely works with Next 16 / React 19 / Tailwind 4?

Checked the Vercel/AI SDK ecosystem first, as directed.

| Library | Latest version (npm registry, checked live) | React support | Notes |
|---|---|---|---|
| `ai` (Vercel AI SDK core) | **7.0.37** | peer dep only `zod: "^3.25.76 \|\| ^4.1.8"` — no React peer dep on the base package | **VERIFIED** via `registry.npmjs.org/ai/latest` |
| `@ai-sdk/react` (the `useChat` hook) | **4.0.40** | peer dep `react: "^18 \|\| ~19.0.1 \|\| ~19.1.2 \|\| ^19.2.1"` — `19.2.4` in this repo satisfies `^19.2.1`. Depends on `ai@7.0.37`. | **VERIFIED** via `registry.npmjs.org/@ai-sdk/react/latest`. This is the one to actually check before installing — the base `ai` package alone has no chat UI. |
| AI Elements (`vercel/ai-elements`) | Distributed as source via the shadcn CLI, not a versioned npm install | Requires "AI SDK installed" and a shadcn/ui-initialized project; built for Next.js | Confirmed to sit *on top of* `@ai-sdk/react`'s `useChat` — see §2. |
| `@assistant-ui/react` | **0.14.27** | peer dep `react: "^18 \|\| ^19"`, `react-dom: "^18 \|\| ^19"` — no upper-bound pin, so 19.2.4 is in range | **VERIFIED** via `registry.npmjs.org/@assistant-ui/react/latest`. No Next.js-specific peer dependency was listed. |
| shadcn/ui itself | CLI v4 (per the `vercel:shadcn` skill) | Full Next.js App Router support; Tailwind v4 syntax (`@theme inline`) is the CLI's current theming model | **VERIFIED** via the loaded `vercel:shadcn` skill content, which is itself a current Vercel-maintained source. |
| shadcn official chat primitives (`message-scroller`, `message`, `bubble`, `attachment`, `marker`) | Released June 2026 per `ui.shadcn.com/docs/changelog/2026-06-chat-components` | Same as shadcn/ui generally | **VERIFIED** page content, fetched directly. |
| `shadcn-chatbot-kit` (Blazity) | — | Built with Next.js + shadcn/ui + Tailwind + the AI SDK, per its own GitHub README | Tailwind v4 / Next 16 support specifically is **UNVERIFIED** — search turned up only a general (unrelated) shadcn/ui-vs-Tailwind-v4 GitHub discussion, not this kit's own compatibility statement. Would need to read its `package.json` directly before adopting. |

None of these are Next-16-specific in a way that breaks — they're all built against the App Router's Route Handlers + standard Web `Response` streaming, which this version of Next still supports unchanged (confirmed against the bundled docs, not memory, per the `AGENTS.md` instruction).

**Not evaluated in depth:** VapiBlocks. The ticket itself already scopes it as voice-specific and v0.2; confirmed nothing there changes that (it's a voice-widget kit, not a text chat/message-list library).

## 2. Copy-in vs. installed dependency

This is the single clearest finding, and it splits cleanly:

**Copy-in (you own and edit the source; installed via CLI, not `package.json`):**
- **shadcn/ui core primitives** (`button`, `dialog`, `card`, `alert`, etc.) — the CLI copies files into `components/ui/`. **VERIFIED** (this is the entire premise of shadcn/ui, restated in the skill: "Components are added directly to your codebase as source code, not installed as a dependency").
- **shadcn's own new chat primitives** (`message-scroller`, `message`, `bubble`, `attachment`, `marker`) — explicitly copy-in per the June 2026 changelog: *"users install them via the CLI... and copy code into their projects, not dependency-based installations."* **VERIFIED.**
- **AI Elements** — installed via `npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/all.json` (or per-component, e.g. `npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/tool.json`), which is the shadcn registry mechanism, not an npm package. The GitHub README states components "become part of your codebase, allowing for full customization." **VERIFIED**, though note: two different install-command spellings appeared across sources (`npx ai-elements@latest add <name>` from the GitHub README summary, and a registry-URL form from the `vercel:shadcn` skill and from `elements.ai-sdk.dev` itself). One fetched component page also returned a third, clearly wrong domain (`shadcn-ui-elements.com`) as an install command — that one is almost certainly a fetch/summarization artifact, not real, and should not be trusted; verify the exact command against `elements.ai-sdk.dev` directly before use.
- **`shadcn-chatbot-kit`** — copy-in via the shadcn CLI per its own docs ("install only what you need, own your components"). **VERIFIED** (docs statement), Tailwind/Next version fit **UNVERIFIED** as noted above.

**Installed dependency (lives in `node_modules`, upgraded via semver, not edited in place):**
- **`ai` / `@ai-sdk/react`** — genuine npm packages. This is the substrate everything else above renders on top of; it is not itself a UI library, it's the streaming/tool-calling engine and the `useChat` hook.
- **`@assistant-ui/react`** — a genuine installed npm package, not copy-in. Its docs (via the search summary — **UNVERIFIED at the docs-page level**, not independently fetched) describe it as providing composable *primitives* (`Thread`, `Message`, `Composer`, `ThreadList`, `ActionBar`) that you compose and style, which narrows the "black box" concern somewhat, but the component logic itself is not sitting in your repo to edit the way shadcn-derived code is.

Given the project's own stated bias ("for a surface this central, copy-in is usually preferable") and the domain-model concerns in §6, the copy-in options (shadcn's native chat primitives, AI Elements, shadcn-chatbot-kit) are structurally the ones that match that bias; `@assistant-ui/react` is architecturally the odd one out here as an installed dependency, regardless of how good its feature set is.

## 3. What do they actually provide?

Checked directly against each project's own component/docs pages.

**shadcn/ui native chat primitives (June 2026, `ui.shadcn.com`):** five components — `MessageScroller` (scroll anchoring, streamed replies, jump-to-message, scroll controls), `Message` (row layout: avatar, alignment, header/content/footer, grouping), `Bubble` (surface variants, alignment, reactions, links, buttons, collapsible content), `Attachment` (files/images, metadata, upload state, actions), `Marker` (status/system notes, separators). Two CSS utilities: `scroll-fade`, `shimmer`. Explicitly minimal — no streaming-text component, no tool-call component, no input component in this initial release. **VERIFIED** (fetched page).

**AI Elements (`elements.ai-sdk.dev`):** by far the broadest catalog — confirmed live sitemap includes, among chatbot-relevant ones: `Message`, `Conversation`, `Reasoning`, `Sources`, `Prompt Input`, `Suggestion`, `Attachments`, `Chain of Thought`, `Context`, `Task`, `Tool`, `Confirmation`, `Model Selector`, `Queue`, `Checkpoint`, `Shimmer`, `Inline Citation`, plus code/agent/workflow/voice component families outside chat scope. **VERIFIED** (fetched live sitemap). Detail on the ones most relevant here:
  - `Message` family: `Message`, `MessageContent`, `MessageResponse` (markdown + GFM + math + streaming render), `MessageActions`/`MessageAction` (arbitrary custom buttons — confirmed these accept any props spreadable to the underlying shadcn `Button`, not just copy/retry), `MessageBranch*` (multiple-response-version navigation). **VERIFIED** (fetched page).
  - `Tool`: display-only. Renders `ToolUIPart` from the AI SDK — `ToolHeader` (name + status badge), `ToolContent`, `ToolInput` (formatted JSON), `ToolOutput`. No approve/deny logic built in. **VERIFIED** (fetched page).
  - `Confirmation`: an alert-style component built specifically for the AI SDK's tool-approval flow (see §5) — renders `ConfirmationRequest` / `ConfirmationAccepted` / `ConfirmationRejected` with `ConfirmationActions`/`ConfirmationAction`, keyed off a tool part's `approval` object and `state`. Wires to `addToolApprovalResponse({ id, approved })`. The documented example is a single tool call (delete-file), not a list of items each needing its own confirmation. **VERIFIED** (fetched page) — this is the most relevant single component to §4 below, with the caveat noted.
  - `Conversation`, `Reasoning`, `Sources`, `Prompt Input`, `Suggestion` exist but were not fetched in full detail (out of the critical path for this ticket's two flagged questions); their existence and naming is verified via the live sitemap.

**`@assistant-ui/react`:** primitives — `Thread`, `Message`, `Composer`, `ThreadList`, `ActionBar` — described (via search summary, not independently fetched from primary docs) as shipping "production UX out of the box: streaming, auto-scroll, retries, attachments, markdown, code highlighting, voice dictation, keyboard shortcuts." **Feature breadth here is UNVERIFIED at the primary-doc level** — worth re-confirming directly against `assistant-ui.com/docs` before relying on it.

**`shadcn-chatbot-kit`:** `Chat` (composable or prebuilt), auto-scroll message area, message input (auto-resize + file upload), prompt suggestions, message actions (copy, rate), loading states, and "visual tool execution states" + "cancel support for running operations." Per-item confirm/edit/delete was not documented in what was fetched. **VERIFIED** existence of these components (fetched README), tool-call rendering *mechanics* **UNVERIFIED** in detail.

None of the libraries checked ship a dedicated "streaming text" component beyond markdown-aware response renderers (`MessageResponse` in AI Elements) — streaming itself is handled by `useChat`/the transport layer, not by a UI component.

## 4. CRITICAL — tap-to-confirm affordances (per-item confirm/edit/delete inside a message)

This is the highest-value question and the answer is nuanced, not a clean yes/no.

- **Nothing found ships a ready-made "list of N items, each with its own confirm/edit/delete control" component.** No library's docs described this exact pattern.
- **The closest verified primitive is AI SDK's own tool-approval state machine**, which is new enough that it postdates most training knowledge and had to be checked live:
  - Tool definitions can set `needsApproval: true` (or an async predicate).
  - `useChat` tool parts carry a `state` field that can be `approval-requested`, `approval-responded`, `output-available`, `output-denied`, in addition to the ordinary `input-streaming` / `input-available` / `output-error`. **VERIFIED** by fetching `ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage` directly.
  - The farmer-facing UI reads `part.input` (the parsed candidate data) and calls `addToolApprovalResponse({ id: part.approval.id, approved })` to confirm or reject. **VERIFIED** by fetching `ai-sdk.dev/cookbook/next/human-in-the-loop` directly.
  - AI Elements' `Confirmation` component (§3) is a pre-built shadcn-style wrapper around exactly this state machine.
  - Because `part.input` is just data sitting in client state before approval, an edit affordance (let the farmer change a quantity before confirming) is *possible* to build on this substrate — the SDK gives you the pending, editable payload and a single approve/deny call — but this is not a documented, off-the-shelf feature. It would need to be composed: one tool call per parsed snapshot (or one approval-gated call per line item, which has real design implications for the agent's tool granularity — see [The agent's tool surface](../issues/21-agent-tool-surface.md)), with a farmer-editable form built on top of `Confirmation`/`Tool`, not swapped in from a library default.
  - `@assistant-ui/react` has an overlapping but distinct mechanism: "human tools" (`addResult()`), an interrupt/resume pattern, and its own `approval` prop / `respondToApproval()` with "allow once" vs. "allow always" options. **UNVERIFIED at the primary-doc level** (only surfaced via search summary of `assistant-ui.com/docs/tools/tool-ui`, not independently re-fetched in full) — but structurally it is the same shape: single-tool-call approve/deny, not native per-item list confirmation.
  - `assistant-ui`'s separate "Generative UI (JSON spec)" feature was explicitly checked and explicitly does **not** cover this: its own docs state generative UI is "useful for dashboards, status panels, and structured layouts — not for collecting user input; use Tool UI for that instead." **VERIFIED** by fetching `assistant-ui.com/docs/tools/generative-ui` directly. No example there shows per-list-item confirm/edit/reject either.
- **Bottom line:** every option requires building the actual tap-to-confirm-per-line-item UI yourselves. What differs is the substrate you'd build it on: the AI SDK's approval-state machine (works with any of the copy-in options, including plain shadcn) is the most directly verified building block; nothing ships the finished affordance.

## 5. CRITICAL — rendering UI from tool calls (generative UI)

The current, verified AI SDK pattern (checked against `@ai-sdk/react@4.0.40` / `ai@7.0.37` docs, fetched directly, not from memory):

- `useChat` messages carry a `parts` array. Each tool call/result is a typed part: `type: 'tool-${toolName}'` (e.g. `tool-resolve_product`), or `type: 'dynamic-tool'` for tools not known at compile time.
- Each tool part has a `state`: `input-streaming` → `input-available` → (optionally `approval-requested` → `approval-responded`) → `output-available` / `output-error` / `output-denied`.
- Rendering is a plain `switch`/`if` in application code matching on `part.type` and `part.state`, e.g.:
  ```tsx
  if (part.type === 'tool-resolve_product') {
    switch (part.state) {
      case 'output-available': return <ResolutionChip {...part.output} />
      case 'output-error': return <div>Error: {part.errorText}</div>
    }
  }
  ```
  **VERIFIED** by fetching `ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage` directly.
- AI Elements' `Tool` and `Confirmation` components are pre-styled shells for exactly this switch — they don't replace the pattern, they give you a designed default for the generic states (pending/running/error) so custom rendering is only needed for the states where a domain-specific view matters (e.g. the read-back card).
- This maps directly onto the six proposed tools in [The agent's tool surface](../issues/21-agent-tool-surface.md) (`extract_items`, `resolve_product`, `propose_snapshot`, `commit_snapshot`, `amend_item`, `get_live_availability`) — each becomes one `part.type` with its own renderer. That ticket's open question ("is `extract_items` a tool at all, or a structured-output call outside the tool loop?") matters here concretely: only things that go through the AI SDK's tool-call mechanism get this `parts`-array treatment for free. A plain `generateObject` call for extraction would need its own bespoke rendering path, not this one.
- `@assistant-ui/react`'s Tool UI is structurally the same idea (a `render` function registered per tool, receiving `args`/`status`/`result`) but is assistant-ui's own runtime abstraction rather than the AI SDK's `parts` array directly, per the search-summarized docs — **UNVERIFIED in full**, worth a direct read of `assistant-ui.com/docs/tools/tool-ui` before relying on this distinction.

## 6. What do these assume about the message/conversation model, and does it leak into the domain layer?

This is where the project's own architecture already has a clear, correct instinct (see [The channel adapter seam](../issues/08-channel-adapter-seam.md) and [Making the flow visible to the founder](../issues/22-generative-ui-flow-visibility.md)), and the research confirms the instinct rather than complicating it.

- **Every library that renders tool calls assumes the AI SDK's `UIMessage`/`parts` shape** (`message.parts[]`, `tool-${name}` typed parts, the approval state machine in §4–5) *or* a comparable proprietary shape (`@assistant-ui/react`'s own thread/message model, which the search summary describes as "messages contain `parts` — text, tool-call, data" — structurally similar but a distinct implementation, not interchangeable with the AI SDK's own types without a bridge). Either way, **this is a channel-shaped (chat, browser, synchronous-turn) data model**, not the domain's availability-snapshot model.
- **shadcn's own new chat primitives are the one option that states this boundary explicitly and by design**: `MessageScroller` "owns [scroll] behavior without owning your messages, AI state, transport, persistence, or model state." **VERIFIED**, fetched directly. That is exactly the adapter-seam property the project wants: the component owns rendering/scrolling behavior, and the app supplies its own data shape into it.
- **AI Elements and `@assistant-ui/react` are more opinionated**: both are built to consume `useChat`'s (or assistant-ui's own) message/parts format directly, which means the tool-call → component mapping — the exact coupling flagged as a risk in ticket 22 — is easiest to build using the vocabulary these libraries expect. The project's own draft resolution (tool-call → component mapping lives in the chat-PWA adapter; the core only emits structured tool results) is consistent with using any of these, **provided** the mapping/rendering code stays inside the chat-PWA adapter layer and the six agent tools are designed as channel-agnostic structured calls first, UI-shape second — not the reverse. Nothing in any library forces the reverse, but nothing prevents it either; that discipline is a project decision, not something a library enforces.
- **Concretely, for the SMS/voice seam**: `part.type`/`part.state`/`approval-requested`, `Bubble`/`Marker`/`Tool`/`Confirmation` components, and `Thread`/`Composer`/`ActionBar` primitives are all screen/synchronous-turn concepts with no SMS or voice equivalent. That confirms the ticket's premise (a tap-to-confirm screen affordance has no SMS analog) rather than resolving it — the resolution is a ticket-20/22 design decision, not a library choice.

## 7. Accessibility and mobile

- **shadcn/ui (and therefore AI Elements and `shadcn-chatbot-kit`, both built on it) is built on Radix UI primitives** (or, as of the CLI v4 changes documented in the loaded `vercel:shadcn` skill, optionally Base UI) — **VERIFIED** via the skill content itself, which is a current Vercel-authored source, though a dedicated shadcn accessibility doc page (`ui.shadcn.com/docs/accessibility`) returned a 404 when fetched directly, so a from-the-source accessibility conformance statement (WCAG level, etc.) could not be pinned down. Radix/Base UI's general reputation for keyboard nav and ARIA roles is well established but that reputation itself is **not independently re-verified here against a primary accessibility audit** — flagged as **UNVERIFIED at the conformance-claim level**, only the "built on Radix/Base UI" fact is verified.
- **`@assistant-ui/react`** is described in secondary sources as built on Radix UI with "complete accessibility support through WAI-ARIA compliance" — this is **UNVERIFIED**: it came from a WebSearch summary, not a fetched primary doc page (no dedicated accessibility page was found at `assistant-ui.com`).
- **None of the libraries researched make farmer-specific claims** (one-handed use, outdoor glare/contrast, poor signal/offline resilience, large touch targets). This is expected — these are general-purpose chat UI kits, not agricultural-field UI kits — but it means **the mobile/outdoor/one-handed requirement in [The chat surface design](../issues/20-chat-surface-design.md) is not something any of these libraries satisfies out of the box**; it would need to be designed on top, regardless of which base is chosen (touch target sizing, offline/poor-signal handling of the `useChat` transport, contrast for outdoor screens, thumb-reachable confirm buttons).
- Component-level touch-target and sizing control is generally in the adopter's hands either way: shadcn's own gotcha docs note that most shadcn components (e.g. `Avatar`) take no `size` prop and are sized via Tailwind classes — **VERIFIED** via the loaded skill content — meaning touch-target sizing for tap-to-confirm buttons is something this project would set explicitly regardless of which library it starts from.

## Comparison table

| | shadcn native chat primitives | AI Elements | `shadcn-chatbot-kit` | `@assistant-ui/react` |
|---|---|---|---|---|
| Copy-in or dependency | Copy-in | Copy-in (registry) | Copy-in | Installed npm dependency |
| Verified compatible with Next 16 / React 19.2.4 / Tailwind 4 | Yes (shadcn CLI v4, current) | Yes (built on shadcn CLI + `@ai-sdk/react` 4.0.40, both React-19-compatible) | Partially — kit itself Next/Tailwind/AI-SDK-based, but exact v4/16 support **unverified** | Yes (peer dep `react: ^18\|\|^19`, no upper bound) |
| Message list / scroll / bubbles | Yes, dedicated (`MessageScroller`, `Bubble`) | Yes (`Conversation`, `Message`) | Yes (auto-scroll message area) | Yes (`Thread`, `Message`) |
| Streaming text rendering | Not in this release | Yes (`MessageResponse`, markdown+streaming) | Implied via AI SDK, not independently verified | Implied, not independently verified |
| Tool-call rendering | No | Yes (`Tool`, display-only) | "Visual tool execution states" (unverified detail) | Yes (`render` fn per tool) |
| Built-in approve/deny (closest thing to tap-to-confirm) | No | Yes (`Confirmation`, single tool call) | Not documented | Yes (approval prop / `respondToApproval`, unverified detail) — single tool call |
| Per-item (list) confirm/edit/delete | **No — not found anywhere** | **No** | **No** | **No** |
| Input affordances | Not in this release | Yes (`Prompt Input`, `Suggestion`, `Attachments`) | Yes (auto-resize input, file upload, prompt suggestions) | Yes (`Composer`) |
| Empty/error states | Not explicit | `output-error` state handling; no dedicated empty-state component found | "Loading states" only, documented | Not independently verified |
| Explicit "we don't own your message model" stance | **Yes, explicitly stated** | No (built to `useChat`'s shape) | No | No (own runtime model) |
| Accessibility basis | Radix/Base UI (verified as basis; conformance claims unverified) | Same (built on shadcn) | Same (built on shadcn) | Radix UI claimed (unverified, secondary source only) |

## Open items / things to re-verify before deciding

- `shadcn-chatbot-kit`'s actual `package.json` — Tailwind v4 and Next 16 support was not confirmed from its own repo files.
- `@assistant-ui/react`'s docs (`tool-ui`, `interactables`, any accessibility page) were partly obtained via WebSearch summaries rather than direct page fetches, because direct WebFetch access was intermittently unavailable during this research session. Anything marked UNVERIFIED above involving assistant-ui should be re-checked with a direct fetch of `assistant-ui.com/docs/*` before being relied on for the actual decision ticket.
- The exact AI Elements install command differs across sources fetched (`npx ai-elements@latest add <name>` vs. a shadcn registry URL vs. one clearly spurious domain); confirm the live command on `elements.ai-sdk.dev` at implementation time rather than trusting either transcript here.
