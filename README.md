# Argument Maps

Ethereum's protocol debates, told in the words of the people who argued them.

Each map follows one debate (ePBS, EOF, PeerDAS, issuance, gas repricing and
more) as a timeline: who said what, when, and why, from the first proposal to
the decision or to where it stands today. Every quote plays its talk from the
second it was said, or links to the exact post it came from.

Read them at [ethereumtv.co/maps](https://ethereumtv.co/maps).

## Suggest a point

Something important missing, a quote out of context, a date wrong? Open an
issue with the **Suggest a point** form (every map on the site has a button
that opens it for that map), or send a pull request. You need two things:

- the source: a talk with a timestamp, or a link to the exact post, EIP or
  forum reply;
- the words: the passage you want quoted, as it was said or written.

Both sides of a debate are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md)
for how a point gets onto a map and [QUALITY.md](QUALITY.md) for the bar
every quote has to clear.

## What is here

| Path                  | What it holds                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `maps/<slug>.json`    | One map: its stops in date order, each quote with its caption text and timestamp, plus what was left out and why.                      |
| `sources/<slug>.json` | For every written source a map quotes: the link, when it was read, a SHA-256 fingerprint of the text as read, and the passages quoted. |
| `tools/check.mjs`     | The checks anyone can run without a database: shape, dates, and that every cleaned quote traces word by word to its captions.          |
| `QUALITY.md`          | The editorial bar.                                                                                                                     |

Run the checks:

```bash
node tools/check.mjs maps/*.json
```

## How changes reach the site

Pull requests are checked automatically, then reviewed independently against
the full transcripts and saved sources, then merged by a maintainer. Merged
maps are loaded onto ethereumtv.co by a separate job that re-runs every check,
including the ones that need the transcripts, before anything changes. A map
that fails a check is not loaded.

## Licence

- Maps (the selection and order of quotes, notes, titles, intros and status
  cards): [CC BY 4.0](LICENSE-CONTENT.md). Reuse them freely; credit
  "Ethereum TV".
- Quotes remain the words of the people quoted, used here as quotation with
  credit to each speaker or author.
- Tools: [MIT](LICENSE).
