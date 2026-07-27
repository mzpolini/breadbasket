# Making the flow visible to the founder

Type: prototype
Status: closed — merged
Audience: us
Blocked by: 20, 21

## Closed — merged into the chat surface design

[Chat UI component options](19-chat-ui-components.md) established that the verified generative-UI pattern is matching `message.parts[]` on `tool-${toolName}` — which means the farmer's view and the founder's view really are **one mechanism at two verbosity levels**, not two surfaces. The farmer sees the read-back; the founder sees the read-back plus the extraction and resolution steps that produced it.

Given that, prototyping them separately would design the same thing twice. Merged into [The chat surface design](20-chat-surface-design.md), which now carries the verbosity-dial question and the "what does a failure render as" question — the most informative moments and the easiest to hide.

## Question

The founder is technical and wants to understand what the agent is doing — which tools fire, with what inputs, returning what. The stated preference is that this be **generated UI driven by the tool calls themselves**, not a terminal-style JSON dump.

- What does **each tool render as**? [The agent's tool surface](21-agent-tool-surface.md) proposes six; each needs a visual form that says what happened at a glance — a parse result, a resolution, a read-back, a commit, a diff, a list.
- Is this a **separate admin view, or a verbosity dial on the main surface**? This is the sharp question. If UI generates from tool calls, the farmer view and the founder view are the *same mechanism* at different detail levels — the farmer sees the read-back card, the founder sees the read-back card plus the extraction and resolution steps that produced it. That is a much better design than two parallel UIs, and it should be actively considered before building an "admin panel".
- What does a **failure** render as? A parse that returned nothing, a product that resolved to unknown, a validate-and-retry that fired. These are the most informative moments and the easiest to hide.
- Does the founder need **timing and cost** (latency per call, tokens), or just structure and data flow?
- Is it **live** as the turn runs, or a review view afterwards?
- Does it need to be **shareable** — a link to one session's flow?

## The tension worth resolving here

Generative UI couples the agent's tool schema to a React rendering layer. That is exactly the coupling [The channel adapter seam](08-channel-adapter-seam.md) exists to prevent: an SMS adapter cannot render a component, and a tool set shaped by what looks good in a browser will not survive the move to voice.

The likely resolution is that the **tool-call → component mapping lives in the chat-PWA adapter**, and the core only emits tool calls with structured results. Worth confirming explicitly rather than discovering it later — if the founder's flow view starts driving tool design, the seam has already leaked.

## Approach

Use `/prototype`. Stub tool results are enough — this is about what the rendering *reads like*, not about wiring a real agent. Link the artifacts from this ticket.

## Scope note

Justified in v0.1 because the pilot user *is* the technical founder and his understanding of the flows is part of what the pilot produces. Note the honest caveat: a tool-call visualiser is the opposite of "design for a flip phone in a truck" — this view serves the founder-as-builder, not the farmer-as-user, and should not be mistaken for evidence about the product.
