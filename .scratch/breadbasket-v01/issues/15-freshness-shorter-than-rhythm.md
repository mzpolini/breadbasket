# When freshness runs shorter than the rhythm

Type: grilling
Status: closed — merged
Audience: us
Blocked by: 01, 03

## Closed — merged into the conversation design

Largely dissolved by [The availability record shape](01-availability-record-shape.md). This ticket assumed the weekly check-in was the farmer's *only* chance to change anything, which made a three-day freshness window inside a seven-day rhythm a structural problem. A ledger removes that assumption: he can send a movement whenever he likes, and "sold out" is something he says rather than something we wait a week to learn.

What survives is one question about words rather than structure — does a lapsing item get its own nudge, and does that violate "one check-in and one nudge, ever"? That has moved to [The check-in conversation](07-check-in-conversation.md), where it sits alongside the stocktake prompt, which is the same problem.

## Question

The founder set a weekly rhythm: confirm Sunday, reminder Monday. But freshness is per-product, and some products do not last a week. Salad greens confirmed Sunday evening may be false by Wednesday, and the next confirmation is six days away.

This gap is created by the very decoupling that makes the model good — the farmer's habit and the food's truth are separate, so they can disagree.

- What does the public view show on Thursday for an item whose freshness window closed on Wednesday? Hidden, or shown as lapsed?
- Does a lapsing item trigger its **own** nudge mid-week — and does that violate the one-check-in-one-reminder rule, or is it the "expiry nudge" the north star already allowed for?
- Is the weekly confirmation better read as a **short-horizon forecast** ("what I expect to have this week") rather than a stock count? That reframing dissolves much of the gap, and fits the window model from [The availability record shape](01-availability-record-shape.md) — but it means nothing is ever a hard "in stock now" claim.
- Should fast-moving products simply be **excluded** from weekly confirmation and handled some other way?

## Why it matters

This is where "fresh or hidden" is actually tested. Everything else is design; this is the promise.
