# How the Sunday ping reaches the farmer

Type: grilling
Status: open
Audience: us
Blocked by: —

> Unblocked: [Scheduled nudge delivery to a PWA](13-scheduled-nudge-delivery.md) was ruled out of scope, so this is decided on judgement rather than a survey. At one farmer, a plain outbound text or even a human nudge is a legitimate pilot answer — the founder's Sunday 7pm requirement still needs *some* answer before the spec is buildable, but it does not need a web-push investigation to get one.

## Question

Given what is actually deliverable, how does the Sunday 7pm ping and the Monday 7am reminder get to the founder?

- Which channel, and what does it cost him in friction? If web push needs install-to-home-screen, that is the exact hurdle this product exists to remove — is it acceptable for a pilot of one, and is it acceptable ever?
- Is an **outbound-only SMS reminder** the honest answer even though SMS-as-a-transport is v0.2? It would mean the farmer's first touch each week is a text, which is arguably closer to the north star than a push notification.
- What happens when the ping is **missed entirely** — device off, no signal? Does the week simply go unconfirmed and everything lapse, or is there a catch-up?
- Does the reminder fire if he **partially** confirmed?
- Is one reminder genuinely the cap? The north star is emphatic about nudge fatigue, and the founder's schedule respects it — worth confirming it stays that way under pressure.

## Not the same as scheduling

[The research memo](../research/framework-model-provider-memo.md) recommends Inngest for cron plus durable retries. That answers *what fires the job at 7pm Sunday* — it does not answer *how the message reaches a human who is not looking at the app*. Keep the two apart: the scheduler belongs to [Where availability data lives](10-data-store-and-stack.md) and [The v0.1 model and provider stack](16-model-and-provider-stack.md); this ticket is only about delivery.

## Why it matters

The check-in is the whole product. If the invitation to it does not arrive, nothing else in the system matters.
