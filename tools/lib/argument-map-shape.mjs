/*
 * ETV-915: the checks a machine can run on an Argument Map file without the
 * database: shape (fields, date order, unique ids, contributor credit) and
 * clean verbatim (every quote traces to its captions, scripts/lib/
 * clean-verbatim.mjs). Shared by load-map.mjs and the public repo's
 * tools/check.mjs, so both refuse the same files.
 */
import { lineProblems } from './clean-verbatim.mjs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const text = (v) => typeof v === 'string' && v.trim().length > 0
const squash = (v) => v.replace(/\s+/g, ' ').trim()

/** Every problem in a map, as "where: what" strings. Empty means it passes. */
export function mapProblems(map) {
  const problems = []
  const fail = (where, what) => problems.push(`${where}: ${what}`)

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(map.slug ?? ''))
    fail('map', 'slug must be lowercase words joined by hyphens')
  if (!text(map.title)) fail('map', 'title is missing')
  if (!text(map.intro)) fail('map', 'intro is missing')
  if (!Array.isArray(map.eips) || !map.eips.every((e) => /^EIP-\d+$/.test(e)))
    fail('map', 'eips must look like "EIP-7732"')
  if (!Array.isArray(map.stops) || map.stops.length === 0)
    fail('map', 'a map needs at least one stop')

  const seen = new Set()
  let previous = ''
  for (const stop of map.stops ?? []) {
    const where = stop.id ?? '(stop without id)'
    if (!/^[a-z0-9-]+$/.test(stop.id ?? ''))
      fail(where, 'id must be lowercase letters, digits and hyphens')
    if (seen.has(stop.id)) fail(where, 'duplicate id')
    seen.add(stop.id)
    if (!DATE.test(stop.date ?? '')) fail(where, 'date must be YYYY-MM-DD')
    else if (stop.date < previous) fail(where, `out of date order (after ${previous})`)
    else previous = stop.date
    if (!text(stop.date_label)) fail(where, 'date_label is missing')
    if (!text(stop.place)) fail(where, 'place is missing')
    if (stop.kind === 'decision' || stop.kind === 'status') {
      for (const f of ['title', 'body', 'link_label'])
        if (!text(stop[f])) fail(where, `${f} is missing`)
      if (!/^https:\/\//.test(stop.link ?? '')) fail(where, 'link must be https')
    } else if (stop.kind === 'quote') {
      if (!UUID.test(stop.talk_id ?? '')) fail(where, 'talk_id must be a talk uuid')
      if (!/^[a-z0-9-]+$/.test(stop.speaker_slug ?? '')) fail(where, 'speaker_slug is missing')
      // A panel or a video holding several talks credits more than one person:
      // the meaning check has to have confirmed whose voice this is.
      if (stop.speaker_confirmed !== true) fail(where, 'speaker_confirmed must be true')
      if (!Array.isArray(stop.lines) || stop.lines.length === 0)
        fail(where, 'a quote stop needs lines')
      ;(stop.lines ?? []).forEach((line, i) => {
        const at = `${where}#${i}`
        if (!Number.isInteger(line.t) || line.t < 0) fail(at, 't must be a whole second')
        if (!text(line.clean) || !text(line.caption))
          fail(at, 'clean and caption are both required')
        if (!Array.isArray(line.chunks) || line.chunks.length === 0) fail(at, 'chunks are required')
        else {
          if (line.chunks[0].t !== line.t) fail(at, 'the line must play from its first chunk')
          line.chunks.forEach((c, n) => {
            if (!Number.isInteger(c.ord) || c.ord < 0 || !Number.isInteger(c.t) || !text(c.raw))
              fail(at, 'every chunk needs ord, t and raw')
            else if (n > 0 && c.ord !== line.chunks[n - 1].ord + 1)
              fail(at, 'chunks must be consecutive transcript segments')
          })
          // The caption shown under the quote is exactly the verified chunks.
          const joined = line.chunks.map((c) => c.raw).join(' ')
          if (squash(joined) !== squash(line.caption ?? ''))
            fail(at, 'caption must be the chunks joined, word for word')
        }
        /* ------------------------------------------------ 2. clean verbatim */
        if (text(line.clean) && text(line.caption)) for (const p of lineProblems(line)) fail(at, p)
      })
    } else if (stop.kind === 'written') {
      // ETV-907: a post, paper, EIP or forum reply, quoted exactly.
      for (const f of ['author', 'source_title']) if (!text(stop[f])) fail(where, `${f} is missing`)
      if (!/^https:\/\//.test(stop.source_url ?? '')) fail(where, 'source_url must be https')
      if (stop.author_slug != null && !/^[a-z0-9-]+$/.test(stop.author_slug))
        fail(where, 'author_slug must be a speaker slug')
      if (!Array.isArray(stop.lines) || stop.lines.length === 0)
        fail(where, 'a written stop needs lines')
      ;(stop.lines ?? []).forEach((line, i) => {
        if (!text(line.text)) fail(`${where}#${i}`, 'text is required')
        else if (/\.\.\.|\u2026/.test(line.text))
          fail(`${where}#${i}`, 'no ellipses: a cut passage is two lines')
      })
    } else fail(where, 'kind must be quote, written, decision or status')
    // ETV-915: a point suggested through the public repo credits its contributor.
    if (stop.contributor != null) {
      if (!text(stop.contributor.name)) fail(where, 'contributor needs a name')
      if (stop.contributor.url != null && !/^https:\/\//.test(stop.contributor.url))
        fail(where, 'contributor url must be https')
    }
  }

  return problems
}
