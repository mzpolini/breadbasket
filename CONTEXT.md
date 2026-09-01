# Breadbasket — Domain Glossary

The shared language for the farm-inventory domain. Vocabulary only; no implementation.

## Core

- **Farm** — one tenant. A farmer's record, page, and conversation belong to exactly one farm.
- **Farmer** — the person who tells us what the farm has. The only writer of inventory.
- **Customer** — anyone reading a farm's public page. Never writes.
- **Movement** — a single claim the farmer made about stock: an add, remove, spoil, or true-up. The only source of truth; balances are derived.
- **Position** — the derived balance of one product on one farm, folded from its movements. Never stored.
- **Read-back** — the agent's restatement of what it heard, offered for approval. Nothing is written until the farmer approves it.
- **Published** — a read-back the farmer approved, now written as movements. He approves either by tapping the card or by saying so plainly; both publish the same card. (Not "confirmed" — see below.)

## The two axes of a claim

Every movement carries both, independently:

- **On hand** vs **forecast** — *when* the claim is about. On hand = stock the farm has now. Forecast = a claim about a future window. A forecast never makes a product available to a customer.
- **Measured** vs **estimated** — *how sure* the claim is. Measured = weighed or counted. Estimated = the farmer hedged ("about forty pounds"). Hedged language is always recorded as estimated. Visible to the farmer, and to wholesale buyers; never to a farm-stand customer, who sees no quantities at all.

"Confirmed" is deliberately not a term. It was used for all of published, on hand, and measured; use the specific word.

## Time and trust

- **Freshness window** — how long an on-hand position is trusted after the farmer last said anything about the product. Flat seven days for the POC. This is a *trust* clock (has he checked in?), not a spoilage guess (does the food still exist?).
- **Flagged** — an on-hand position whose last claim is older than the freshness window. Derived, never stored. Resolves itself the moment the farmer says anything about that product. Flagged stock is never removed by the system; it stays on the record and on the page, visibly stale, until the farmer resolves it.
- **Spoil** — a movement kind: the farmer's own record that some stock went bad. A reduction he states, never a judgement the system makes.
- **Check-in** — the farmer talking to the app about existing stock. Expected at least weekly; there is no maximum. Where flags get resolved, estimates get measured, and harvest rules get reconciled.

## Cadence

- **Harvest rule** — a standing statement of recurring expected harvest: a crop, an expected amount, an interval, and an end. "Twenty pounds of watermelon every week through September." Stored once, with the farmer's own sentence kept verbatim, not expanded into future entries. Changing or ending a rule is a new rule that supersedes the old; newest wins. A rule is flagged by the same freshness window as stock when the farmer hasn't spoken about the crop.
- **Coming soon** — what a customer sees derived from harvest rules. A forecast, never stock.
- **Harvest** — a real pick-up confirmed by the farmer, written as an on-hand movement. The only way a harvest rule ever turns into stock.

## Storefront

- **Farm stand** — the farm's public page for customers. Shows *availability only* — never quantities, units, or measured/estimated. Split into **available now** (on-hand positions) and **coming soon** (harvest rules, shown as the farmer's sentence).
- **In season** — a storefront label. Applies to everything currently on the stand; it carries no data and is not a state.
- **Freshness** — shown to the customer as how long ago the farmer last spoke. Flagged items stay on the stand, visibly stale. The stale page is the farmer's reminder to check in; there is no other nudge in the POC.
- **Wholesale account** — a future, gated buyer view of the same inventory that *does* show quantities. Out of scope for the POC.

## Working with the founder

- **Founder callout** — an open question written into the north-star doc, in enough context to stand alone, for the founder to answer in his own words. The doc is the only surface; there is no in-app board.
- **Success metric** — weeks with at least one check-in ÷ weeks on platform, per farm.
