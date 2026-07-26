# Scheduled nudge delivery to a PWA

Type: research
Status: closed — out of scope
Audience: us
Blocked by: —

## Closed

Ruled out of v0.1 scope as research. The delivery *decision* survives as [How the Sunday ping reaches the farmer](14-nudge-channel-decision.md), which is now unblocked and must be made on judgement rather than a survey — with one farmer who is the founder, a human or a plain outbound text is a legitimate pilot answer and does not need a web-push investigation to reach.

## Question

The founder has specified an automated ping at Sunday 7pm and a reminder at Monday 7am. That is a scheduled outbound message to a farmer who is not currently looking at the app — and a browser is a poor place to receive one. What is actually deliverable?

- **Web push in 2026.** What works on iOS Safari and on Android Chrome? What does iOS require — is install-to-home-screen still a precondition, and what is the current permission flow?
- **Reliability.** How often does a scheduled web push actually arrive on time, and what happens if the device is off or offline at 7pm?
- **Alternatives.** Email, calendar invite, or an **outbound-only SMS** that links into the PWA. Note this last one does not breach the SMS-is-v0.2 boundary: a one-way reminder is not a conversation transport, and the confirming still happens in the app.
- **Scheduling.** What runs a cron-like job on the platform this app deploys to, and what are the guarantees?

## Constraint

Facts and citations, not recommendations — the choice belongs to [How the Sunday ping reaches the farmer](14-nudge-channel-decision.md). Load the `marketplace` skill before naming any provider.

## Output

Findings as a Markdown file in the repo, with a pointer added back to this ticket.
