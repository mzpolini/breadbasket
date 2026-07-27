# How we know the parser is right

Type: grilling
Status: closed — out of scope
Audience: us
Blocked by: 06, 17

## Closed

Out of scope for v0.1, on the reasoning this ticket already contained: *"the honest answer might be very little, and we watch the transcripts instead."* A golden set, a scoring rubric, and a pass bar are the right machinery for a parser serving many users where errors reach people silently. At n=1, every parse is read back and confirmed before anything publishes, and the one user is the founder — so the eval loop is *reading the transcripts*, which is both cheaper and more informative than a score.

**Constraint carried forward:** keep every transcript and every parse result. That is the eval set when there is something to evaluate, and it costs nothing to retain. It is also what [Collect how the founder actually says it](17-collect-real-utterances.md) is already gathering by hand — the pilot should accumulate the same thing automatically.

Returns when parses stop being individually reviewed by a human — which is the first farmer who isn't the founder.

## Question

Structured-output reliability is the system's load-bearing property, and schema-valid output can still be semantically wrong. What tells us the parser works?

- What is the **golden set**? Real utterances from [Collect how the founder actually says it](17-collect-real-utterances.md), hand-labelled with the correct snapshot.
- What is **scored**, and how? Exact match on product and unit is easy; quantity and freshness are fuzzier. Does a near-miss on quantity count as a pass?
- What is the **pass bar**, and what happens below it? A number nobody acts on is not a bar.
- Is an **LLM-as-judge** appropriate for read-back faithfulness, or does that just move the trust problem?
- Where does this **run** — CI, or a thing someone runs by hand before deploying?
- Given the confirm-before-publish loop catches errors anyway, how much eval is proportionate for one farmer? The honest answer might be "very little, and we watch the transcripts instead."

## Why it matters

The confirm loop makes parse errors visible rather than dangerous — but a parser that is wrong often enough to be annoying will fail the "under two minutes" bar even when it never publishes a lie.
