# Breadbasket — Domain Glossary

The shared language for the farm-inventory domain. Vocabulary only; no implementation.

## Core

- **Farm** — one tenant. A farmer's record, page, and conversation belong to exactly one farm.
- **Farmer** — the person who tells us what the farm has. The only writer of inventory.
- **Customer** — anyone reading a farm's public page. Never writes.
- **Movement** — a single claim the farmer made about stock: an add, a removal, or a true-up. The only source of truth; balances are derived. A removal also carries a **loss reason**.
- **Position** — the derived balance of one product on one farm, folded from its movements. Never stored.
- **Crop** — what the farm grows, in his words: heirloom tomatoes, bell peppers, okra.
- **Variety** — a named kind of a crop: German Johnson, Brandywine, green. Optional, and learned only from what he tells us — there is no canonical produce list. A position is held against a crop and, where he named one, a variety. Speaking about the crop alone is a claim about all of its varieties, for freshness; a quantity he gives at crop level stays there and is never split across them.
- **None left** — a position he has emptied, whether or not he ever gave it a number. Distinct from **flagged**, which is silence, and never inferred: it is something he said. Never listed on the stand.
- **Merge** — teaching that two crop names are the same thing, so their claims fold into one position. What a rename means here, since nothing in the ledger is ever rewritten.
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
- **Loss reason** — why stock went: sold, spoiled, wildlife, pests, weather, donated, own use. Carried by a removal and independent of it — the reason never changes the arithmetic, only the record. Always his own sentence as well as the term. Wildlife and weather are ordinary on a farm, not edge cases.
- **Spoil** — one loss reason among several: food that went bad. A reduction he states, never a judgement the system makes. Deer in the okra is **wildlife**, not spoilage — the crop never reached a crate.
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

- **Founder** — Thelonious. He has shipped web apps and can read anything we put in front of him; that is exactly why we don't. He hears about a mechanism only where it changes what the product does, what it promises a farmer, or what it costs to be wrong. Everything else is ours to carry.
- **Founder callout** — an open question written into the north-star doc, in enough context to stand alone, for the founder to answer in his own words. Each one names the decision, the options, and what each option buys or costs — enough for him to make the call in a sentence, without reading code. The doc is the only surface; there is no in-app board.
- **Founder report** — what we send back after he has used it. Told in the farmer's terms, not the system's, and it includes the failures he didn't notice as well as the ones he did. Its job is to arm him with the decisions in front of us and let him make the executive call; it is never a bug list and never a fix log.
- **Success metric** — weeks with at least one check-in ÷ weeks on platform, per farm.
