/**
 * The Farmer's Almanac.
 *
 * What Breadbasket believes, what a small yes turned into, and the words we
 * mean. The admin page at /admin/almanac renders this and nothing else, so a
 * change to the record is a change here. Move `tended` when you edit it.
 *
 * A field the directory already reads is a conversation with them, not only
 * a commit.
 */

export const tended = '22 November 2026'

export const preface =
  'Breadbasket keeps what a farmer has said about the food on his farm, and refuses to invent the rest. The directory shows that record to someone deciding whether to make the trip. A line below often started as a small yes about a farmer\u2019s own page. The same yes decides what a pin is allowed to claim. We change a line here first, in the open.'

export const howToRead = [
  {
    k: 'Soil',
    body: 'The belief underneath. Move this and several cards move with it.',
  },
  {
    k: 'Requirement',
    body: 'What the software does because of the belief.',
  },
  {
    k: 'Consequence',
    body: 'What a farmer, a partner, or the map will actually see.',
  },
] as const

export type Soil = {
  id: string
  title: string
  body: string
}

/** The ground. Short on purpose. The cards below are where each one reaches. */
export const soil: Soil[] = [
  {
    id: 'yes-is-the-gate',
    title: 'His yes is the gate',
    body: 'Nothing is public until he approves the read-back. The book holds what he said.',
  },
  {
    id: 'forecast-is-never-stock',
    title: 'A forecast is never stock',
    body: 'Expecting a crop is a different claim from having it. The calendar does not harvest.',
  },
  {
    id: 'clock-is-trust',
    title: 'The clock measures trust',
    body: 'Seven days asks whether he has looked. It does not guess whether the food survived.',
  },
  {
    id: 'two-honesties',
    title: 'Two audiences, two honesties',
    body: 'The farmer\u2019s page may grey a crop the map has to call gone. A pin has no grey.',
  },
  {
    id: 'farm-is-the-tenant',
    title: 'The farm is the tenant',
    body: 'People share one inventory. The pin on the map is the farm, not a login.',
  },
  {
    id: 'numbers-stay-home',
    title: 'A number is private',
    body: 'Customers and the directory see availability. Pounds stay with the farmer.',
  },
]

export type Standing = 'decided' | 'hypothesis' | 'open'

export type Entry = {
  id: string
  /** Index label, "01", "H1", "Q1". */
  number: string
  /** Short line for the side index. */
  index: string
  title: string
  standing: Standing
  /** The yes, the belief we are operating on, or the question still open. */
  lead: string
  soil: string
  requirement: string
  consequence: string
  source: string
}

export const entries: Entry[] = [
  {
    id: 'coming-soon-holds',
    number: '01',
    index: 'The date does not ripen it',
    title: 'Coming soon does not ripen when the date arrives',
    standing: 'decided',
    lead: 'A forecast never becomes stock. He agreed a harvest rhythm is read as coming soon, and that a rule which names its own end stands until that date. Neither yes said the crop turns available on the morning the window opens.',
    soil: 'The calendar is not a harvest. Only the farmer can move food from expected to here.',
    requirement:
      'coming_soon stays coming_soon after expected_from. The row remains while the window is open. It drops when available_until has passed, when he ends the rule, or, if he named no dates, after seven days without mentioning it. in_season is written only when he confirms a harvest.',
    consequence:
      'Brussels sprouts on the seed farm, coming_soon with expected_from 2026-11-01, are still coming soon on 22 November. That date is the day the window opened. If an end date is still ahead, say the window. If there is no end, say \u201cComing soon.\u201d Do not lead with Expected and a date that has passed. A forecast that ends is omitted. It does not pass through gone. gone is for food that was on hand.',
    source: 'ADR 0001, amended by ADR 0004. The read API.',
  },
  {
    id: 'named-season-stands',
    number: '02',
    index: 'A named season stands',
    title: 'A season he described stands until the day he named',
    standing: 'decided',
    lead: 'He was content with unconfirmed items greying and sinking to the bottom, unless the farmer has explicitly stated he will have kale each week from now through December.',
    soil: 'The freshness flag asks one question: is this still on? A rule that names its end has already answered, for the period it names.',
    requirement:
      'A rule with an end date is not marked stale before that date, however long ago he said it. A rule with no end date ages at seven days. A live rule does not keep on-hand stock fresh.',
    consequence:
      'One sentence in September can keep a crop as coming_soon into December, on the stand and in the API. That row is not stuck. We believe him about the future he described. We believe him about the present only when he says it again. The directory will see long-lived coming_soon rows, sometimes with an expected_from already in the past.',
    source: 'ADR 0004, 12 September 2026. His words, reading his own stand.',
  },
  {
    id: 'grey-and-gone',
    number: '03',
    index: 'Grey here, gone on the map',
    title: 'The stand greys. The map says gone.',
    standing: 'decided',
    lead: 'He asked for an item to be marked gone after seven days without an update. He also said the stale page is the reminder, and that we are fine without messaging. Both cannot be true on one surface. Each audience got its own answer. He can still reverse the stand.',
    soil: 'Someone deciding whether to drive needs a yes or a no. A farmer needs a page that gets quieter when he has been away, because that page is the only nudge we send.',
    requirement:
      'On the stand, a stale item stays, greyed, with how long it has been. In the API the same silence becomes gone after GONE_AFTER_DAYS, default 7. None left is gone immediately. A gone row stays in the response for 14 days, then drops. The two clocks are separate decisions that happen to share a number. The API\u2019s number is a setting. The stand\u2019s 7 is the pilot\u2019s number, in code.',
    consequence:
      'The surfaces disagree for a few days, and that is intended. Nine quiet days: the stand still lists the crop, greyed, and the API says gone. Take the pin down on gone, or when the item disappears. There is no grey pin to paint. If he would rather the stand empty too, that change is the stand alone. The API contract stays.',
    source: 'The check-in decision in NORTHSTAR. The map rule was built as the reversible choice and left with him.',
  },
  {
    id: 'none-left',
    number: '04',
    index: 'No number means none left',
    title: 'No amount on the way out means none left',
    standing: 'decided',
    lead: 'He confirmed that no number means all of it, unless the farmer explicitly says to reduce the count.',
    soil: 'The card he approves and the book we keep have to say the same thing. Most positions never had a number, so there is nothing to subtract from.',
    requirement:
      'A removal with no amount empties the position. The read-back states the result, none left, so the yes is about the outcome. A partial removal needs a figure. Silence does not empty a position. The reason it went \u2014 sold, spoiled, wildlife, pests, weather, donated, own use \u2014 is stored with his sentence and stays on the farm.',
    consequence:
      'Deer in the okra takes okra off the map the same day, as gone. The directory never sees the reason, the sentence, or the pounds. Wildlife is a loss in the field, not food that rotted in a crate. We record those reasons because he called the record vital. A report built from them is still open, below.',
    source: 'ADR 0002, 11 September 2026. He confirmed it after the second beta.',
  },
  {
    id: 'one-rule',
    number: '05',
    index: 'One sentence, not future weeks',
    title: 'A rhythm is one sentence, not a stack of future weeks',
    standing: 'decided',
    lead: 'The first beta broke on twenty pounds of watermelon every week through September. The cheap repair was one forecast row per week. We stored the sentence once.',
    soil: 'The book records what exists and what he has claimed. Weeks that have not grown yet would make a forecast look like stock, and a change would have to chase every week.',
    requirement:
      'A cadence is one harvest rule: crop, expected amount, interval, optional start, optional end, and his sentence kept verbatim. A change is a new rule. Newest wins. Only every week is structured. Any other shape stays in his words. The stand shows the sentence. The API shows coming_soon and the dates, and withholds the sentence.',
    consequence:
      'The directory receives one row for the crop, not a pin per future week. There is no computed next Thursday unless he named a date we can stand behind. A missed week writes nothing. The phrase book further up is how to speak a row when you do not have his sentence.',
    source: 'ADR 0001, 27 August 2026.',
  },
  {
    id: 'trust-clock',
    number: '06',
    index: 'Seven days of trust',
    title: 'Seven days asks whether he has looked',
    standing: 'decided',
    lead: 'Flag, don\u2019t delete, is permanent. Seven days is a temporary number for the pilot. A different window per crop was sketched and left unbuilt.',
    soil: 'Freshness is a trust clock. It asks whether he has checked in. It is not a model of spoilage.',
    requirement:
      'The stand flags at seven days. The API says gone at GONE_AFTER_DAYS, default 7, which can change without a code change. Kale and tomatoes use the same number.',
    consequence:
      'If a crop feels wrong on the map, the conversation is about that one number. A per-crop expiry on the directory side would give fresh a second meaning, beside the one the farmer sees.',
    source: 'NORTHSTAR, spoilage and freshness. lib/settings.ts.',
  },
  {
    id: 'no-chase',
    number: '07',
    index: 'We do not chase him',
    title: 'The stale page is the only reminder',
    standing: 'decided',
    lead: 'Asked about messaging, he said we are fine without it for now, with unconfirmed items going stale and listed at the bottom.',
    soil: 'A reminder he did not ask for becomes a chore. The page going quiet is the ask.',
    requirement:
      'No push, no email, no text for a check-in. Stale items sort below live ones. Opening his own stand is the nudge.',
    consequence:
      'A quiet farm becomes gone on the map after a week, and nobody has pinged him. Read that silence as a reason not to send someone for the crop. It is not a statement that the farm has closed.',
    source: 'NORTHSTAR, the weekly check-in. His words.',
  },
  {
    id: 'only-what-he-approved',
    number: '08',
    index: 'Only what he approved',
    title: 'The book claims only what he approved',
    standing: 'decided',
    lead: 'A bug wrote a read-back he had corrected and never approved, nine times. Those rows were deleted. A later correction would have left the history saying he told us something he did not.',
    soil: 'Append-only is a promise about his claims. It is not a promise to keep our mistakes.',
    requirement:
      'Nothing is public until he approves the read-back, by tapping the card or saying so plainly. The same card cannot publish twice. Rows he never approved are deleted. Anything he did say is corrected forward, by a new line.',
    consequence:
      'The API will not grow a crop because a model guessed it. A row that vanishes without a gone was not his claim, or a forecast window ended, or the fourteen days after gone ran out. gone means something that was here has left.',
    source: 'ADR 0003, 11 September 2026.',
  },
  {
    id: 'no-quantities',
    number: '09',
    index: 'No quantities leave the farm',
    title: 'Quantities stay with the farmer',
    standing: 'decided',
    lead: 'The stand shows availability. It never shows a weight, a count, or the word estimated. Numbers are for him and, later, for a wholesale buyer.',
    soil: 'A customer needs to know there are tomatoes. A number we are not ready to stand behind is a worse promise than silence.',
    requirement:
      'Through the beta the API sends quantity, unit, and price as null. The fields are in the contract so filling them later does not break a reader. Measured versus estimated is visible to the farmer and hidden from the stand and the directory.',
    consequence:
      'A pin has to make sense with no quantity on it. When numbers arrive they belong to a later, gated view. They will not leak onto the public stand.',
    source: 'NORTHSTAR, the farm stand. The API contract for the beta.',
  },
  {
    id: 'his-words',
    number: '10',
    index: 'His words are the catalog',
    title: 'The produce list is the words he uses',
    standing: 'decided',
    lead: 'Heirloom tomatoes, then German Johnson and Brandywine, were stored as unrelated crops. He said a quantity named at the crop is the combined amount, not a figure to split across varieties. A rename is a merge. The book is never rewritten.',
    soil: 'There is no canonical produce list. We learn a variety only when he names one.',
    requirement:
      'A position is a crop and, where he named one, a variety. Speaking about the crop refreshes every variety under it. The API still sends one item per crop, and variety is null until that model is shipped.',
    consequence:
      'Heirloom tomatoes and tomatoes can both appear until someone merges them. Match the string we send. Folding our words into a standard list will split what he meant as one planting. When variety arrives it is a name under the crop, not a second pin.',
    source: 'NORTHSTAR, varieties. He answered the quantity question. The API field is still waiting on the build.',
  },
  {
    id: 'one-status',
    number: '11',
    index: 'One crop, one status',
    title: 'One crop sends one status',
    standing: 'decided',
    lead: 'Two answers for one planting is how a map lies.',
    soil: 'The most useful truth wins. What is here outranks what is coming. What is coming outranks what went.',
    requirement:
      'in_season over coming_soon over gone. None today, more from Thursday, is a single coming_soon. When the crop is in_season, expected_from is null, and available_until carries the rule\u2019s end if he named one. A position below zero is left out: a line is missing, so we will not say here and we will not say gone.',
    consequence:
      'The same product will not appear twice for one farm. An omitted crop and a gone crop are different signals. gone means we will say it left. Omitted means we will not say.',
    source: 'The read API. lib/projections/api.ts.',
  },
  {
    id: 'pin-is-the-farm',
    number: '12',
    index: 'The pin is the farm',
    title: 'The profile is the farm. The email is a person.',
    standing: 'decided',
    lead: 'One directory profile is one farm. A farm can have an owner, an operator, and family. The tenant was built that way from the first row.',
    soil: 'Inventory belongs to the farm. A login belongs to a person. The pin is the profile, and the profile is the farm.',
    requirement:
      'Several people can be invited onto one farm and they share one inventory. Each write records who said it. farm_id never changes. The public page is /f/{slug}, and the slug can. The directory profile id lives on the farm and is unique. An invitation requires an admin to attest that the email matches that person\u2019s MABFC member record. We do not look the address up in Dataverse. Sign-in matches the verified email to the invitation.',
    consequence:
      'Store farm_id on the directory profile. The owner email on a spreadsheet invites a person. A second person from the same farm is a second invitation to the same farm_id. Two emails, one inventory. The profile id is the join. The email is how the right person gets in.',
    source: 'The farm and invitation model for the pilot. lib/db/schema.ts.',
  },
  {
    id: 'unknown-looks-absent',
    number: '13',
    index: 'Unknown looks absent',
    title: 'A farm the API will not claim is answered as if it were not there',
    standing: 'decided',
    lead: 'A farm is in the API when it is KYF-verified and carries a directory profile id. Every other farm gets the same answer as a farm that does not exist.',
    soil: 'The public surface should not reveal who is half onboarded. Verification is a gate.',
    requirement:
      'The bulk call omits an unmapped farm. The single-farm call is a 404, the same 404 as an unknown id. An empty items array means we know the farm and it has nothing to report. The public stand answers 404 for an unverified farm too. The farmer can still preview the page.',
    consequence:
      'Missing from the list means not verified, no profile id, or a wrong id. Present, with no items, means mapped and quiet. Store profile ids as they arrive. Mark a farm KYF-verified when it is actually in the pilot. Verifying every property on a directory export before anyone has checked in would put empty farms on the map.',
    source: 'CONTEXT, mapped farm. The pilot handoff.',
  },
  {
    id: 'find-me-stays',
    number: 'H1',
    index: 'Find Me stays put',
    title: 'Where and when to buy stays in the directory',
    standing: 'hypothesis',
    lead: 'The directory already has Find Me. We have a single optional line on the farm, such as at the market Saturdays, 8 to 1. We have no model of markets, stands, or hours.',
    soil: 'A fact kept in two places will be wrong in one of them. Where to find the farm is a relationship the directory already holds.',
    requirement:
      'The stand shows the name, an optional tagline, that one market line, and availability. It does not sync markets or hours, and the API does not publish them.',
    consequence:
      'Maintain Find Me in the directory through the pilot. Thelonious has floated showing it on the stand Breadbasket runs. If we do that later, the directory remains the record. The stand is not a second Find Me today.',
    source: 'Working boundary, November 2026. Not yet a decision of his.',
  },
  {
    id: 'stand-stays-a-card',
    number: 'H2',
    index: 'The stand stays a card',
    title: 'The stand does not wear the directory\u2019s profile',
    standing: 'hypothesis',
    lead: 'Photos, the long profile, and the KYF badge live in Dataverse. The pilot stand does not show them.',
    soil: 'The stand is a window onto availability. The north star says it becomes a profile with the farm\u2019s story. That is a direction, and it is not this pilot.',
    requirement:
      'KYF verified decides whether a public page exists. It is not drawn as a badge. A logo and a tagline, when we have them, are fields we store. farm_stand_url is how a pin opens the live list.',
    consequence:
      'The stand is a short card. If the badge or the photos should appear on it, that is a new decision, and the page starts to depend on data we do not own.',
    source: 'The farm-stand work for the pilot. Out of scope on purpose.',
  },
  {
    id: 'check-in-metric',
    number: 'H3',
    index: 'Whether he comes back',
    title: 'We will watch whether he comes back',
    standing: 'hypothesis',
    lead: 'The number we are using is weeks with at least one check-in, divided by weeks on the platform, per farm. We asked him whether that is how he would judge the work. He has not answered on the page.',
    soil: 'A long list of farms can hide a product nobody opens. The loop is the check-in.',
    requirement:
      'Nothing in the API changes because of this. It changes which quiet week we treat as a problem.',
    consequence:
      'A pilot farm with a quiet month is a farmer who did not come back. It is not, by itself, a broken directory connection. Empty availability after a real rhythm of check-ins is a different problem from a farm that never spoke.',
    source: 'NORTHSTAR, the success metric. The question to him is still open.',
  },
  {
    id: 'other-rhythms',
    number: 'Q1',
    index: 'Other rhythms',
    title: 'What other rhythms do farmers actually say?',
    standing: 'open',
    lead: 'We handle every week through a date. He has not told us which other shapes are common enough that a customer needs them structured.',
    soil: 'Tuesdays and Thursdays, every other week, and until frost are real sentences. Parsing them badly is worse than keeping them in his words.',
    requirement:
      'Those sentences stay verbatim. They become dates on the API only when he already gave a window we can stand behind.',
    consequence:
      'Expect some coming_soon rows with no dates, or with a coarse window. When he answers, a new shape can become a field. Until then, do not infer a Thursday.',
    source: 'NORTHSTAR, the harvest-rhythm question. Unanswered.',
  },
  {
    id: 'empty-the-stand',
    number: 'Q2',
    index: 'Empty the stand too?',
    title: 'Should seven quiet days empty the stand as well?',
    standing: 'open',
    lead: 'The split is built: grey on the stand, gone on the map. It is the reversible choice. He can still ask for the stand to empty.',
    soil: 'One rule is easier to explain. It also means a busy week erases his page, and the page stops being the reminder.',
    requirement:
      'Today the stand keeps the stale item. Switching touches the stand only. The API already says gone.',
    consequence:
      'If this flips, the two surfaces stop disagreeing. The directory\u2019s contract does not move. The farmer loses the nudge.',
    source: 'Left open on purpose when the map rule was chosen.',
  },
  {
    id: 'loss-record-for-whom',
    number: 'Q3',
    index: 'Who a loss record is for',
    title: 'Who is a loss record for?',
    standing: 'open',
    lead: 'He called loss records a vital piece of data for farmers, and extremely valuable. We record the reason now. We have not decided who the report is for.',
    soil: 'His own eye, a disaster program, an insurer, and a lender want different documents. A form that is nearly what an agency wants is worse than no form.',
    requirement:
      'Reasons are written. They stay off the stand and off the API. No loss report is scheduled.',
    consequence:
      'The directory will not receive loss data. If a later product shares any of it, that is a new promise and a new field. It is not a reinterpretation of gone.',
    source: 'docs/founder/loss-records.md, 12 September 2026.',
  },
  {
    id: 'per-crop-freshness',
    number: 'Q4',
    index: 'Per-crop freshness',
    title: 'Should freshness differ by crop?',
    standing: 'open',
    lead: 'One number for every crop is honest while the clock means he has looked. It will feel wrong the moment someone reads it as spoilage.',
    soil: 'Tomatoes and winter squash do not keep the same way. We do not know enough to encode that, and encoding it would claim that we do.',
    requirement:
      'One window, for every crop. A future per-crop table has to be a decision recorded here, not a quiet patch.',
    consequence:
      'The directory should not lay its own per-crop expiry on top of our status. Two clocks will hide a crop we still call in season, or show one we have called gone.',
    source: 'NORTHSTAR. Sketched, not built.',
  },
  {
    id: 'second-network',
    number: 'Q5',
    index: 'A second network',
    title: 'Is there a second network beside this directory?',
    standing: 'open',
    lead: 'Black Farmers of Maryland was named as a map that already has farmers. The relationship was deferred. We asked who owns it, and whether a farmer\u2019s email there is the one they would use with us.',
    soil: 'This directory, and MABFC\u2019s Know Your Farmer verification, is the first network. A second map is a second join.',
    requirement: 'Nothing is built for a second directory. A farm carries one profile id.',
    consequence:
      'A farm cannot hold two profile ids today. A second network needs its own decision about identity before it needs an endpoint.',
    source: 'NORTHSTAR, dependencies. The question to him is unanswered.',
  },
]

export type Phrase = {
  when: string
  say: string
}

export const reading = {
  id: 'how-to-say-a-row',
  lede: 'The stand may quote him. The API withholds the sentence, so the directory has to speak from the fields. This is how we would say each row. Dates are calendar dates.',
  note: 'last_updated is when the farm last spoke about that item. On the bulk response, generated_at changes every call and does not mean he checked in. Cache for the minutes the headers allow, and honor Retry-After.',
  rows: [
    {
      when: 'coming_soon, expected_from still ahead, no available_until',
      say: 'Expected {expected_from}.',
    },
    {
      when: 'coming_soon, both dates, and expected_from is still ahead',
      say: '{expected_from} \u2013 {available_until}. The stand shows a one-off forecast as a range.',
    },
    {
      when: 'coming_soon, expected_from already past, available_until still ahead',
      say: '{expected_from} \u2013 {available_until}. The window is open. He has not confirmed a harvest, so this is not in season.',
    },
    {
      when: 'coming_soon, expected_from already past, no available_until',
      say: 'Coming soon. Brussels sprouts on 22 November 2026, expected_from 2026-11-01 and no end date, is this row.',
    },
    {
      when: 'coming_soon, no dates',
      say: 'Coming soon.',
    },
    {
      when: 'in_season, no available_until',
      say: 'Available.',
    },
    {
      when: 'in_season, with available_until',
      say: 'Available, through {available_until}.',
    },
    {
      when: 'gone',
      say: 'Leave it off the map. The row is here so a pin can come down. It stays 14 days, then we omit it.',
    },
    {
      when: 'The item disappeared',
      say: 'Take it down. If gone was already seen, the 14 days ran out. If gone never arrived, a forecast ended.',
    },
    {
      when: 'The farm is absent from the bulk list',
      say: 'Not verified, no profile id, or the id does not match. This is different from a farm with an empty list.',
    },
    {
      when: 'The farm is present and items is empty',
      say: 'We know the farm. It has nothing to report right now.',
    },
  ] satisfies Phrase[],
}

export type Word = {
  term: string
  means: string
}

export const words: { id: string; title: string; terms: Word[] }[] = [
  {
    id: 'words-directory',
    title: 'What the directory sees',
    terms: [
      {
        term: 'farm_id',
        means: 'The Breadbasket farm. Immutable. Safe to store on the directory profile. The public URL uses the slug, which can change.',
      },
      {
        term: 'directory_profile_id',
        means: 'Your profile id, stored on our farm, unique. We echo it back so the join is yours to check.',
      },
      {
        term: 'farm_stand_url',
        means: 'The public availability card. Availability only.',
      },
      {
        term: 'in_season',
        means: 'He has it now, and he has spoken about it within the silence window. This is not the In season badge on the stand. That badge is a label on a listing. It carries no data of its own.',
      },
      {
        term: 'coming_soon',
        means: 'He expects it. A standing rule, or a one-off forecast. Never stock, including after expected_from.',
      },
      {
        term: 'gone',
        means: 'He said none left, or on-hand stock has been silent long enough. Reported for 14 days so a pin can come down, then omitted.',
      },
      {
        term: 'expected_from',
        means: 'The start of a window he named. A start in the past means the window has opened. It does not mean the crop is late, and it does not mean the crop is here.',
      },
      {
        term: 'available_until',
        means: 'The end he named, when he named one. For an in_season row it is the standing rule\u2019s end, if there is one.',
      },
      {
        term: 'last_updated',
        means: 'When he last said anything about that item, or about the farm. Not the moment we generated the response.',
      },
    ],
  },
  {
    id: 'words-ours',
    title: 'What we mean among ourselves',
    terms: [
      {
        term: 'Farm',
        means: 'The tenant. One inventory, one stand, one profile id.',
      },
      {
        term: 'Farmer',
        means: 'A person who can write that inventory. Several farmers can share one farm. Each write remembers who said it.',
      },
      {
        term: 'Mapped',
        means: 'KYF-verified and holding a directory profile id. Only a mapped farm is in the API.',
      },
      {
        term: 'Harvest rule',
        means: 'A standing expectation, stored once, in his sentence. Coming soon on the stand is that sentence. The API is the dates.',
      },
      {
        term: 'On hand',
        means: 'Stock he says is here. The only thing that can be in_season.',
      },
      {
        term: 'Forecast',
        means: 'A claim about a future window. It never makes a crop available.',
      },
      {
        term: 'Flagged',
        means: 'On the stand: stale, still listed, greyed. The API\u2019s word for the same silence, once the window has run out, is gone.',
      },
      {
        term: 'None left',
        means: 'He emptied it. Distinct from flagged, which is only silence. The API says gone.',
      },
      {
        term: 'Read-back',
        means: 'Our restatement of what we heard, offered for his approval. Nothing is written before that yes.',
      },
      {
        term: 'Measured / estimated',
        means: 'Whether he weighed it or hedged. Visible to him. Hidden from the stand and the directory.',
      },
      {
        term: 'Loss reason',
        means: 'Why stock went. It never changes the arithmetic, and it never leaves the farm.',
      },
      {
        term: 'Variety',
        means: 'A kind he named under a crop. Decided, and not yet on the API. Until then variety is null.',
      },
    ],
  },
]

export const colophon =
  'Edit this record in lib/almanac/content.ts and move the tended date with the edit. A change to a field the directory already reads is a conversation with them, not only a commit. Design questions that are about look and feel live in DESIGN.md. The decisions that became these cards are written out in docs/adr and in NORTHSTAR.md.'
