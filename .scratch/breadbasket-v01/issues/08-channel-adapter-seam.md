# The channel adapter seam

Type: grilling
Status: closed — downgraded to a constraint
Audience: us
Blocked by: 01, 07

## Closed

Designing a seam against one implemented adapter is architecture on speculation, which this ticket's own constraint warned against. With one farmer and one channel there is no second case to test a boundary with, and a boundary designed without one is a guess wearing a diagram.

What the seam was actually protecting is not a design — it is a short list of things not to do, and that survives as **spec constraints** rather than a decision session:

1. Conversation state is serializable and channel-agnostic, in our own database — never React state, never a provider's session or thread store.
2. No synchronous non-streaming request/response assumption in the agent core.
3. No provider's raw SDK hard-coded; go through the provider-agnostic interface.
4. No channel assumptions — chat markdown, buttons, component rendering — inside the domain layer. The tool-call-to-component mapping lives in the chat-PWA adapter.
5. Movements stay attributable to a farm; farm-identifying data isn't denormalised where a future purge couldn't find it (inherited from [Consent, takedown, and data ownership](11-consent-and-takedown.md)).

These are now recorded on the map and belong in the spec's non-functional section. They are enforceable by review without anyone designing an interface for a channel that does not exist yet.

The real seam gets designed when there is a second adapter to design it against — which is the v0.2 SMS work.

## Question

The model goes high and v0.1 builds one adapter. Where exactly is the line?

- What belongs to the **agent core** — parsing, normalisation, state transitions, expiry, the decision to nudge?
- What belongs to a **transport adapter** — message delivery, session identity, rendering, confirmation affordance?
- What is the interface between them, concretely enough that an SMS adapter in v0.2 is an implementation of it rather than a rewrite?
- Which chat-PWA conveniences are **honest** to rely on, and which would weld the core to a browser? A visible scrollback and tap-to-confirm have no SMS equivalent — is that a seam violation or an adapter capability the core can query?
- Does the core assume synchronous turn-taking? SMS and voice differ sharply here.

## Two concrete pressures on the seam

**Generative UI.** The plan to render UI from tool calls ([Making the flow visible to the founder](22-generative-ui-flow-visibility.md)) couples the tool schema to a React layer. An SMS adapter cannot render a component. The likely resolution is that the tool-call → component mapping lives in the chat-PWA adapter and the core only emits structured tool results — but if the founder's flow view starts driving tool *design*, the seam has already leaked.

**The rewrite list.** [The research memo](../research/framework-model-provider-memo.md) names four couplings that would force a v0.2 rewrite, and they are worth adopting as explicit acceptance criteria: state coupled to the browser or to a provider's session/thread store; a synchronous non-streaming request/response shape; hard-coding a provider's raw SDK instead of the SDK's provider-agnostic interface; and channel assumptions (chat markdown, buttons) embedded in the domain layer.

## Constraint

Resist over-abstracting. One real adapter and a sketch of a second is enough evidence; anything more is architecture on speculation.
