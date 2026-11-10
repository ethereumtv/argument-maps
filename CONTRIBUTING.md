# Contributing

Thank you for helping keep these maps complete and fair.

## The quickest way: suggest a point

Use the **Suggest a point** issue form. Give the source and the words; a
maintainer turns it into a stop, checks it against the transcript or the
saved source, and credits you on that stop if you would like to be credited.

Good suggestions:

- a missing turning point: a call that changed the spec, a decision, a new
  argument, a founding post;
- a voice from a side of the debate the map does not yet hear;
- a correction: a quote that reads differently in its context, a wrong date,
  a wrong speaker.

## Sending a pull request

1. Edit `maps/<slug>.json`. Keep stops in date order, give a new stop a new
   `id`, and never reuse an old one.
2. A **talk quote** (`kind: "quote"`) has `talk_id`, `speaker_slug`,
   `speaker_confirmed: true`, and lines with `chunks` (the caption segments,
   exactly as they appear in the transcript), `caption`, `clean` and `t`. A
   maintainer can fill `t` and the chunks from a timestamp: you may send just
   the talk link, the timestamp and the `clean` text.
3. A **written quote** (`kind: "written"`) has `author`, `source_title`,
   `source_url` (the permalink to the exact post) and `lines: [{ "text" }]`,
   each one exact, contiguous passage of the source.
4. Add yourself on any stop you add:
   `"contributor": { "name": "Your Name", "url": "https://github.com/you" }`.
5. Run `node tools/check.mjs maps/<slug>.json` and fix what it reports.

## What happens next

1. **Automatic checks** run on your pull request.
2. **Independent review.** Someone other than the proposer reads every new
   line in its full context and checks meaning, speaker and fairness
   (QUALITY.md, checks 4 to 8). The source is saved and fingerprinted.
3. **Merge.** A maintainer merges when the review passes.
4. **Load.** The site's sync re-runs every check, including the transcript and
   source checks, and loads the map. Nothing that fails is published.

## Ground rules

- Quotes are the speaker's own words in their order. No paraphrase, no
  stitching words from different moments, no changing how strong a claim is.
- Never a gotcha. A map tracks how an idea moved, never who "changed their
  mind".
- An argument posted under a handle is credited to the handle as shown. Never
  guess who is behind it.

By contributing you agree that your contribution to the maps is licensed
under CC BY 4.0 and your contribution to the tools under MIT.
