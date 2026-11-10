# The quality bar

A quote puts words under a real person's name. A wrong one costs that person
far more than a missing map ever would, so every map clears this bar every
time it is loaded.

## What makes a good map

- **A story, not a list.** Stops run in date order from the first time the
  idea comes up to the decision, or to where it stands now. A reader who only
  reads the quotes understands what was argued, why, and how it ended.
- **Every stop earns its place.** It adds a reason, a turn, an objection or a
  new fact. Two stops that say the same thing: keep the clearer one.
- **Both sides.** If the people who argued against an idea said something
  substantive, it is on the map.
- **Self-contained passages.** One to three sentences that carry the why or
  the how and make sense on their own.
- **Never a gotcha.** Nothing that makes a person look foolish, careless or
  inconsistent, and nothing said in jest presented as a position.
- **Complete, from talks and writing.** Much of a debate happens in research
  posts, EIPs, forum threads and blogs. Every major argument goes on the map,
  whichever medium carried it.
- **No missed turning points.** Every map keeps an `audit` block:
  1. a spec-change ledger: every behaviour-changing change to the EIPs, with
     the call that agreed it; a change the debate turns on is a stop;
  2. outside timelines: every published recap is read, and each dated event
     in it matches a stop or a stated exclusion;
  3. exclusions: a call that changed the spec, decided something or brought a
     new argument is never left out as "process".
- **Handles count.** A sharp argument posted under a handle is credited to
  the handle exactly as shown, linked to the post. Nobody guesses the person
  behind it.

## Talk quotes: clean verbatim

The speaker's own words in their order, with fillers, stutters and false
starts taken out, punctuation added, and misheard caption words corrected in
`[brackets]`. The original caption text is shown under every quote.

Small clarity edits are allowed only with an `edits` note on the line saying
exactly what changed. Never: paraphrase, reordering, joining words from
different moments, or changing how strong a claim is ("might" to "will").

## Written quotes: exact

A written line is one contiguous passage of its source, copied, never
retyped, never cut with an ellipsis. Two passages are two lines. The source is
saved and fingerprinted when it is first quoted (see `sources/`).

## The checks

Run by machine, on every change:

1. **Shape.** Every stop has its date, place and content; dates run in order;
   ids are unique.
2. **Trace.** Every word of a cleaned quote traces, in order, to its caption
   text. Words that change a claim's direction or strength ("not", "never",
   "only", "if", "but", "might", "will") are never treated as fillers.
3. **Source.** Every caption chunk is a real stretch of the stored transcript
   at the second the line plays from; the named speaker is credited on the
   talk; every written line is in its saved source.

Run by an independent reviewer, before a change is merged:

4. **Meaning.** Does the clean text say what the speaker meant there?
5. **Speaker.** Is it really the named speaker's voice (or the post's author,
   on the post's own date)?
6. **Fairness.** No gotcha, and each side gets a fair hearing.
7. **Decision.** A decision or "where it stands" card says only what its
   primary source (an All Core Devs call, an EIP) says.
8. **Turning points.** The passage behind every exclusion is read, and the
   audit block holds.

Checks 1 and 2 run anywhere with `node tools/check.mjs`. Check 3 needs the
transcripts and saved sources and runs when a map is loaded onto the site.
