# The chat surface design

Type: prototype
Status: open
Audience: us
Blocked by: 07

## Question

What does the farmer actually see? [The check-in conversation](07-check-in-conversation.md) settles the words; this settles the surface they arrive on.

- What does the **read-back** look like as a visual object rather than a paragraph? A list of items the founder can scan and correct beats a wall of prose — but it is also further from the "talking to a neighbour" feeling the north star is built on. Which wins?
- **Tap-to-confirm vs typing.** A screen can offer per-item confirm, edit, and delete controls that SMS never could. Using them makes the pilot faster and better; it also makes this less like the conversation we eventually want to move to SMS and voice. How far do we lean in?
- What does it look like **mid-conversation** — is there a persistent view of what is currently live, or only the transcript?
- **Empty state**: the founder opens it for the first time. What is there?
- Does it look like a **product** or like a **prototype**? The pilot is one user and he is the founder, but a surface that feels unfinished will colour every judgement he makes about whether this is worth continuing — which is exactly what [What convinces us this works at n=1](12-n-of-1-success.md) is trying to measure.
- Mobile-first, outdoors, possibly one-handed, possibly poor signal. What does that rule out?

## Also the founder's view of the machinery

Merged from [Making the flow visible to the founder](22-generative-ui-flow-visibility.md). The founder is technical and wants to see which tools fire, with what inputs, returning what — as generated UI, not a JSON dump.

- **It's a verbosity dial, not a second surface.** The verified pattern (matching `message.parts[]` on `tool-${toolName}`) means the farmer's view and the founder's view are the same mechanism at different detail levels: the farmer sees the read-back, the founder sees the read-back plus the extraction and resolution that produced it. Design the dial; don't build an admin panel.
- **What does each tool render as?** A parse result, a product resolution, a read-back, a committed movement, a true-up, a balance. See [The agent's tool surface](21-agent-tool-surface.md).
- **What does a failure render as?** A parse that returned nothing, a product that resolved to unknown, a validate-and-retry that fired. The most informative moments and the easiest to hide.
- Does he need timing and token cost, or just structure and data flow? Live as the turn runs, or reviewable afterwards?
- Honest caveat: a tool-call visualiser serves the founder-as-builder, not the farmer-as-user. It is not evidence about the product.

## What the research established

[Chat UI component options](19-chat-ui-components.md) found that **no library ships per-item confirm/edit/delete inside a message**. The AI SDK's tool-approval state machine is the closest substrate and is genuinely well-shaped for confirm-before-publish — but it is built for a single tool call, not a read-back of eight produce lines. So the central affordance of this product is **custom work whichever library is chosen**, which means the library choice matters less than it looked and this prototype matters more.

## Approach

Use `/prototype`. Several rough variations to react to beats one polished take — and per the skill's own guidance, radically different directions surface the real preference faster than iterations on one. Link the artifacts from this ticket.

## Constraint

The visual design must not dictate the domain model. See [The channel adapter seam](08-channel-adapter-seam.md): affordances a screen has and a phone call does not are adapter capabilities, not core concepts.
