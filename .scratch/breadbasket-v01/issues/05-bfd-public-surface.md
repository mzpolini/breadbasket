# The BFD public surface

Type: research
Status: closed — out of scope
Audience: us
Blocked by: —

## Closed

Ruled out of v0.1 scope. BFD was already non-blocking, and with the pilot at one farmer there is no integration to design against — the farmer model can be revisited when BFD adoption is real. It returns with the v0.2 multi-farmer work, not on this map.

## Question

BreadBasket will eventually source farmers from the Black Farmer Directory, but v0.1 does not integrate with it. This ticket exists so the Farmer model is not designed incompatibly with a database we will adopt later.

From the outside only — we have no code or database access:

- What is BFD, who runs it, and what is on a farmer profile? Name, bio, location, contact, produce?
- Does it expose an API, a feed, an export, or only rendered pages?
- Are profiles stably identified in a way an external system could reference?
- What are the terms of use around reading or mirroring profile data?

## Constraints

Non-blocking. Nothing in v0.1 waits on this. If the public surface turns out to be too thin to characterise, say so plainly and stop — that is a valid finding.

## Output

Findings as a Markdown file in the repo, with a pointer added back to this ticket.
