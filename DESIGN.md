# Breadbasket — Design Visions

*A brainstorm, not a spec. Where the look, the feel, and the flows are argued
out before they're built. Lives alongside [`NORTHSTAR.md`](./NORTHSTAR.md), which
owns what the product *is*; this owns what it *feels like*.*

**Founder:** this doc is half yours. The boxes marked ❓ **FOUNDER** are places
we'd rather hear you than guess. Anything you already have in your head — a
colour, a farm stand you love, a website you hate, a photo — put it in here.
Rough is fine. We'll shape it.

---

## What we have today

The current build uses a system called **Organic**: warm cream paper
(`#f5ead8`), near-black ink, a terracotta accent (`#c67139`) for anything the
farmer can tap, and a sage green (`#7a8a5e`) for anything that is a *forecast*
rather than stock. Headings are Caprasimo, a chunky display face; body is
Figtree; machine-ish lines (timestamps, statuses) are monospace.

Three surfaces, all phone-shaped, all one column:

1. **The chat** — bubbles; the farmer's own words in full terracotta because
   they should be the loudest thing on screen. The read-back card sits inline.
2. **The stock view** — a grouped list: what needs him first, what's fine, what's
   gone stale, what's coming. Dark-ground "crop stack" variant for the
   one-crop-at-a-time pass at dusk.
3. **The farm stand** — a single card. Crop names, availability, a freshness
   line. No numbers.

Every choice so far has been made around one person: a farmer, on a phone,
outdoors, one-handed, in under two minutes.

---

## Emotions we're designing for

Three people, three feelings.

| Who | Should feel | Should never feel |
|---|---|---|
| **The farmer** | In control of his own record. Heard. That the app does less than he'd feared. | Nagged. Audited. That something happened he didn't see. |
| **The customer** | That this is *real* — a specific person, a specific week. Trust. A little delight. | Sold to. Uncertain whether to make the drive. |
| **The founder** | That the product carries the mission, not just the inventory. | That the farms are rows in a database. |

> ❓ **FOUNDER 1 — What should a customer feel in the first three seconds on a farm's page?**
> Is it "this is a real person I could visit"? "This is fresh, this week"? "This
> is part of something bigger" (the Black Farmers of Maryland story)? Pick the
> one that matters most — it decides what goes at the top of the page.
>
> *Answer:*

---

## Colour and material

Working directions, none decided:

- **Paper and ink.** What we have. Warm, quiet, a little hand-made. Risk: reads as
  precious or twee if overdone.
- **Market chalkboard.** Dark ground, chalk-white type, colour only in the
  produce names. Feels like the sign at the stand. Risk: harder to read in sun.
- **Seed-packet.** Bright, illustrative, crop-by-crop colour. Most delightful for
  customers, most work, and it pulls attention to the app instead of the farm.

Whichever wins, two rules already hold from the product decisions:

- **Stock and forecast are never the same colour.** Today: ink vs sage. A
  customer must be able to tell "here now" from "coming" without reading.
- **Stale is greyed, never red.** A stale item isn't an error, it's a farmer
  who's been busy. The page gets quieter about itself; it doesn't raise an alarm.

> ❓ **FOUNDER 2 — Colours, references, no-gos.**
> Any brand colours already in use? Anything in the Black Farmers of Maryland
> map we should rhyme with? Any farm websites or apps you love — or that make
> you wince? Links and photos welcome.
>
> *Answer:*

---

## The farm stand: from window to profile

Today the stand is a list. The north star says it becomes a *profile with the
farm's story in it*. Directions to explore:

- **The farmer at the top.** A photo, a name, one sentence in his voice. The
  produce list beneath. This is the "real person" bet.
- **The week at the top.** "Last updated Tuesday" as the hero, produce right
  under it, the farm's story further down. This is the "fresh, this week" bet.
- **The map at the top.** Where the farm is, and where to find him Saturday.
  This is the "can I actually get there" bet — and the hook into the map product.

Details we're already sure about:

- Four words and no more: **Available**, **Available — not confirmed recently**,
  **Coming soon**, **In season**.
- "Coming soon" is the farmer's own sentence, in quotes. His voice, not ours.
- No quantities. Ever. A customer needs to know there are tomatoes, not how many.

> ❓ **FOUNDER 3 — What does a farmer want the world to know about the farm that isn't produce?**
> A story? Generations? A practice (no-spray, forest-grown)? A market schedule?
> A phone number? Which of these would the farmers you know actually want on
> the page — and which would they be shy about?
>
> *Answer:*

---

## Page flows

### Farmer

```
open app ─→ chat (lands in the conversation he left)
             │
             ├─→ types what he's got ─→ read-back card ─→ taps "Sounds good"
             │                                             └─→ stand updates
             ├─→ "Stock" tab ─→ grouped list ─→ "Talk about what changed" ─→ chat
             │                └─→ one-crop-at-a-time pass (dusk mode)
             └─→ "Your page" tab ─→ the stand, as buyers see it, inside his shell
```

Open threads:

- **The weekly check-in** as a *flow*, not just a rule. Should opening the app
  after 6+ days land him on a "here's what's gone quiet" pass instead of the
  chat? Today the stale page is the only nudge.
- **First run.** No wizard, by design. But is a completely blank stand the right
  first thing to show a farmer who's just registered via the map?

### Customer

```
link / QR / map pin ─→ farm stand ─→ (nothing else)
```

There is deliberately nowhere to go. Open threads:

- **Where does the link live?** A QR on a sign at the stand? The map pin? A text
  from the farmer? Each changes what the top of the page should say.
- **"Is he there today?"** The single most useful thing a customer could see and
  the one we don't capture. Market schedule is a note today, not data.

> ❓ **FOUNDER 4 — How does a customer find a farm's page?**
> Walk us through the real moment: someone is at the market, or on the map, or
> got a text — what happens next? That path is the page's real front door.
>
> *Answer:*

---

## Voice

The agent talks "like a neighbour at the market, not a form." That's already
in the system prompt. For the customer-facing page we haven't decided:

- **Third person, the farmer's name.** "Marcus last updated this Tuesday."
- **First person, as the farmer.** "I've got tomatoes this week."
- **No person, the farm.** "Mighty Thundercloud — updated Tuesday."

> ❓ **FOUNDER 5 — Whose voice is the page in?**
> When a customer reads "coming soon: about twenty pounds of watermelon every
> week through September" — is that the farmer talking, or the farm, or us?
>
> *Answer:*

---

## Parking lot

Things said out loud that aren't decided and aren't urgent:

- Voice input for the farmer (text-only for now; a torch in the other hand
  argues for voice).
- Dark mode everywhere, not just the crop stack.
- A printable version of the stand for a physical sign.
- Photos of produce, by the farmer, from the field.
- Whether the "In season" badge should ever *not* show — e.g. greenhouse crops.
