# The farmer's own inventory view

Type: prototype
Status: open
Audience: us
Blocked by: —

## Question

Graduated from the fog by [What convinces us this works at n=1](12-n-of-1-success.md), where it turned out to be what success criterion 3 actually measures: *he can see his inventory in a way that makes him want to use it again next week to prepare for the farmers market, instead of the paper notebook he uses now.*

This is **not** the public availability view. That one is for buyers and shows a farm to a stranger. This one is his own working picture of what he has — and it is competing with a notebook.

- What does he need to **see at a glance**? Current balances per product, what is lapsing soon, what is still only forecast, what needs weighing?
- What does **market prep** actually look like as a screen? He is deciding what to load into a truck on Saturday morning. Is this a list, a checklist, a table he could read one-handed in a barn?
- How is **estimate debt** surfaced to him — the products whose numbers are guesses stacked on guesses, where the stocktake prompt would fire?
- Does he **edit here, or only in the conversation**? A notebook is directly editable. If this view is read-only he may resent it; if it is editable there are two ways to change inventory and they must agree.
- What does it show for a **future window** — next week's forecast alongside this week's stock?
- Does it work **offline or on bad signal**? The notebook always does. This is the incumbent's strongest advantage and the easiest to lose to.

## The bar to beat

A paper notebook is fast, offline, works in a truck, needs no login, and never misparses anything. It is a stronger incumbent than it sounds. Anything this view does worse than a notebook needs to be paid for by something the notebook cannot do at all — arithmetic that stays correct, expiry that hides stale claims, a public page that updates itself.

## Approach

Use `/prototype`. Several rough directions beat one polished take. Design it against the ledger from [The availability record shape](01-availability-record-shape.md) — balances are derived, so this view is a projection, not a table to edit directly.
