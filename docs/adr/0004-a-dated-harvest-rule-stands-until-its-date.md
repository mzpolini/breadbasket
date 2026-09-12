# 4. A harvest rule stands until the date it names

Date: 2026-09-12

## Status

Accepted. Amends ADR 0001, which had a rule age exactly like stock.

## Context

ADR 0001 gave a harvest rule the same freshness window as a position: seven days without the farmer mentioning the crop and the rule is flagged, shown stale on the farm stand, and asked about at the next check-in. The reasoning was symmetry — a claim is a claim, and the page going visibly stale is the only nudge in the product.

The founder, reading his own stand, drew the line differently. He is content with unconfirmed items greying and sorting to the bottom, *"unless the farmer has explicitly stated 'I'll have kale each week from now through December'"*.

He is right, and the symmetry was the mistake. The flag asks one question — is this still on? — and a rule that names its own end has already answered it for the period it names. Greying it a week later argues with something the farmer told us, on the one surface whose whole job is to be honest about what is unconfirmed. A page that cries stale about a crop he has already spoken for is a page he stops reading, and it is the only nudge we have.

## Decision

A rule that carries an end date is **not flagged** before that date, however long ago it was stated. When the date passes the rule leaves the stand entirely, as it already did, and that is the natural moment to ask about it.

A rule with **no end date** — "kale every week from now on" — still ages at the freshness window, because he has not spoken for any particular period. Days since he last mentioned it are counted for every rule either way, so the agent always knows how long it has been.

**Stock is untouched.** A live rule does not keep a crop's on-hand position fresh. A forecast never makes a crop available (`CONTEXT.md`), and letting a sentence said in September vouch for kale being on the table in November is exactly what the freshness window exists to prevent.

## Consequences

- The stand greys less, and what it does grey is genuinely unconfirmed.
- The check-in has less to ask about, which is the point: the agent no longer raises a crop the farmer has already settled.
- An open-ended rule is the one that ages, which gives "through December" a meaning beyond display — worth knowing when we decide how much of a cadence to structure.
- A rule stated for a long season is trusted for that whole season on one sentence. That is the trade: we believe him about the future he described, and go on trusting only him about the present.
