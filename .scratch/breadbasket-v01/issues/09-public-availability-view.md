# The public availability view

Type: prototype
Status: open
Audience: us
Blocked by: —

## Re-weighted downward

[What convinces us this works at n=1](issues/12-n-of-1-success.md) established that the pilot's value is farmer-facing market prep, not buyer-facing discovery — no buyer uses this page during the pilot. It still needs to exist, because "what you see listed is actually available" is the product's promise and the founder should be able to check we are keeping it. But the surface that success actually depends on is [The farmer's own inventory view](25-farmer-inventory-view.md). Build this one honestly and plainly; spend the design effort there.

## Question

The public view is in v0.1 as a dev URL the founder is pointed at for testing, showing one seed farm. Location is constant, so there is no distance or discovery to solve.

- What does the page show? Current live items, quantities, when each was last confirmed?
- **The annotation must degrade as estimate debt grows** — `estimated` becoming `estimated · not weighed in 3 weeks`. Settled by [The check-in conversation](07-check-in-conversation.md) as the answer to the stocktake-prompt problem: rather than nagging him, the cost of not weighing shows up where buyers see it. This view is therefore load-bearing for a farmer-facing mechanism, not just a buyer-facing one.
- **The annotation is settled in substance, not in form.** [The availability record shape](01-availability-record-shape.md) decided that expiry hides and confidence annotates: a buyer sees whether a figure was *weighed* or *estimated*, and never sees a lapsed item. How that reads on the page is this ticket's job — `50.6 lb · weighed` vs `~25 lb · estimated` is a sketch, not a design, and "estimated" must not read as "unreliable".
- How is **freshness made visible**? "Confirmed today" is the whole product promise — does it earn a prominent place, or is silent hiding enough?
- What does an item **about to lapse** look like, if anything?
- What does the farm show when **nothing is live** — an empty state that still reads as trustworthy rather than broken?
- Is there anything for a buyer to *do*, or is v0.1 strictly read-only? The north star says introductions are v0.2.
- v0.1 shows **confirmed items only** — the unconfirmed/forecast column is v0.2. Does the layout leave an obvious seat for that second column, or is retrofitting it cheap enough not to bother?
- What does the founder need to see here to judge whether it is telling the truth about his farm?

## Approach

Use `/prototype`. Several rough variations to react to beats one polished take. Link the artifact from this ticket.
