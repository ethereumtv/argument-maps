/*
 * ETV-837: the clean-verbatim trace check for Argument Map quotes.
 *
 * A clean quote is the speaker's own words in their order with fillers,
 * stutters and repeats taken out, punctuation added, and misheard caption
 * words fixed in [brackets]. This walks the clean words against the raw
 * caption words and sorts every difference into mechanical changes, which
 * pass on their own, and editorial ones, which a person or the meaning check
 * has to have reviewed:
 *
 * - `added`: clean words the captions do not have at that point (a word
 *   supplied for clarity, or a paraphrase creeping in), including a
 *   [bracket] that does not sound like the words it replaces;
 * - `dropped`: real words skipped inside the quote (a false start taken out,
 *   or meaning cut);
 * - `cutContext`: meaning words in the caption before the quote starts or
 *   after it ends ("we will ship it, but only if ...").
 *
 * Alex (2 Nov 2026): small edits for clarity are fine as long as the
 * original message stays. So none of these is an error by itself: the
 * loader requires each line that has any to carry a reviewed `edits` note,
 * and refuses a line whose added words pass MAX_ADDED_SHARE (that is a
 * paraphrase, not a quote). See scripts/argument-maps/QUALITY.md.
 *
 * Words that carry meaning are never treated as fillers, even when the
 * speaker repeats them: dropping a "not", an "only" or a "might" is always an
 * edit that needs a note (review wave, 2 Nov 2026).
 */

/** Hesitation sounds: always safe to drop. */
const HESITATIONS = new Set(['um', 'uh', 'er', 'ah', 'erm', 'hmm', 'mm', 'uhm'])
/** Discourse markers a speaker leans on: safe to drop on their own. */
const DISCOURSE = new Set([
  'so',
  'well',
  'yeah',
  'okay',
  'ok',
  'basically',
  'actually',
  'just',
  'like',
  'right',
])
/** Two-word fillers, safe to drop only as the pair. */
const FILLER_PAIRS = [
  ['you', 'know'],
  ['i', 'mean'],
  ['kind', 'of'],
  ['sort', 'of'],
]
/** Joining words that change no claim: safe to drop, or to supply for grammar. */
const GRAMMAR = new Set(['the', 'a', 'an', 'and', 'of', 'to', 'that', 'it', 'is', 'its', "it's"])
/** Words that carry the claim's direction or strength: never a filler. */
const MEANING = new Set([
  'not',
  'no',
  'never',
  'nor',
  'neither',
  'none',
  'nothing',
  'nobody',
  'without',
  'cannot',
  'only',
  'unless',
  'if',
  'but',
  'except',
  'all',
  'every',
  'always',
  'some',
  'most',
  'few',
  'maybe',
  'might',
  'may',
  'could',
  'would',
  'should',
  'must',
  'will',
  'can',
  'probably',
])
const NUMBERS = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  twenty: '20',
  hundred: '100',
}
/** How far ahead (raw words) a clean word may be found past dropped words. */
const LOOKAHEAD = 12
/** A [bracket] fixes at most this many caption words. */
const MAX_FIX_SPAN = 3
/** A line whose added words exceed this share of its words is a paraphrase. */
export const MAX_ADDED_SHARE = 0.2

const meaningful = (w) => MEANING.has(w) || /n't$/.test(w)

export function words(text) {
  const s = text
    .replace(/[’‘]/g, "'")
    .replace(/\b(eip)[- ]?(\d+)/gi, '$1$2')
    .replace(
      new RegExp(`\\b(${Object.keys(NUMBERS).join('|')})\\b`, 'giu'),
      (m) => NUMBERS[m.toLowerCase()],
    )
  return (s.match(/[\p{L}\p{N}]+(?:'\p{L}+)?/gu) ?? []).map((w) => w.toLowerCase())
}

/** Letters and digits only, accents folded, any script. */
const norm = (w) =>
  w
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')

/** Raw words joined 1 to 3 at a time can spell one clean word ("block chain"). */
function matchAt(raw, j, w) {
  const target = norm(w)
  if (!target) return 0
  for (let n = 1; n <= 3 && j + n <= raw.length; n++) {
    if (norm(raw.slice(j, j + n).join('')) === target) return n
  }
  return 0
}

/** A raw word the speaker can lose without changing what they said. */
function isFiller(raw, j) {
  const w = raw[j]
  if (meaningful(w)) return false
  if (HESITATIONS.has(w) || DISCOURSE.has(w) || GRAMMAR.has(w)) return true
  const pair = FILLER_PAIRS.some(
    ([a, b]) => (w === a && raw[j + 1] === b) || (w === b && raw[j - 1] === a),
  )
  if (pair) return true
  // A stutter: the same word again within three words either side.
  return raw.slice(Math.max(0, j - 3), j).includes(w) || raw.slice(j + 1, j + 4).includes(w)
}

/** Edit distance, for checking a [bracket] sounds like what it replaces. */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const next = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = next
    }
  }
  return row[b.length]
}

/** A misheard word fixed, not a word changed: close in spelling. */
function soundsAlike(rawWords, fix) {
  const a = norm(rawWords.join(''))
  const b = norm(fix)
  if (!a || !b) return false
  return distance(a, b) / Math.max(a.length, b.length) <= 0.7
}

/**
 * Trace `clean` through `caption`. Returns the mechanical changes
 * (`fillers`, `fixes`, `supplied` joining words) and the editorial ones
 * (`added`, `dropped`, `cutContext`), plus how many clean words there were.
 */
export function traceClean(caption, clean) {
  const raw = words(caption.replace(/\[[^\]]*\]/g, ' '))
  const items = []
  for (const part of clean.split(/(\[[^\]]+\])/)) {
    if (part.startsWith('[') && part.endsWith(']')) items.push({ fix: part.slice(1, -1) })
    else for (const w of words(part)) items.push({ word: w })
  }
  const result = {
    fillers: [],
    fixes: [],
    supplied: [],
    added: [],
    dropped: [],
    cutContext: [],
    cleanWords: 0,
  }
  const skip = (from, to) => {
    for (let s = from; s < to; s++)
      (isFiller(raw, s) ? result.fillers : result.dropped).push(raw[s])
  }
  let i = 0
  for (let k = 0; k < items.length; k++) {
    const item = items[k]
    if (item.word !== undefined) {
      result.cleanWords++
      // The first word may sit anywhere in the caption chunk: the quote can
      // start mid-chunk. After that, a word must come within LOOKAHEAD.
      const first = result.cleanWords === 1 && i === 0
      const reach = first ? raw.length : LOOKAHEAD
      let j = i
      while (j < raw.length && j - i <= reach && !matchAt(raw, j, item.word)) j++
      const n = j < raw.length && j - i <= reach ? matchAt(raw, j, item.word) : 0
      if (!n) {
        // Not in the captions near here: a word supplied by the editor.
        ;(GRAMMAR.has(item.word) ? result.supplied : result.added).push(item.word)
        continue
      }
      // Words before the first clean word are where the quote starts, not
      // cuts inside it; only a meaning word there can turn it.
      if (first) result.cutContext.push(...raw.slice(0, j).filter(meaningful))
      else skip(i, j)
      i = j + n
      continue
    }
    const fixWords = words(item.fix)
    result.cleanWords += fixWords.length
    // A fix replaces 1 to MAX_FIX_SPAN caption words: the smallest span after
    // which the next clean word matches, skipping only hesitations. At the
    // end of the line it takes what is left, minus trailing fillers.
    const next = items.slice(k + 1).find((x) => x.word !== undefined)
    let span = null
    if (!next) {
      let end = Math.min(raw.length, i + MAX_FIX_SPAN)
      while (end > i && isFiller(raw, end - 1)) end--
      span = end - i
    } else {
      for (let s = 1; s <= MAX_FIX_SPAN; s++) {
        let jj = i + s
        while (jj < raw.length && !matchAt(raw, jj, next.word) && HESITATIONS.has(raw[jj])) jj++
        if (jj < raw.length && matchAt(raw, jj, next.word)) {
          span = s
          break
        }
      }
    }
    const replaced = span ? raw.slice(i, i + span) : []
    if (!span || !soundsAlike(replaced, item.fix)) {
      // An inserted or reworded bracket is an editor's word, not a fix.
      result.added.push(...fixWords)
      continue
    }
    result.fixes.push(`${replaced.join(' ')} -> [${item.fix}]`)
    i += span
  }
  // After the quote ends: anything that could turn its meaning.
  result.cutContext.push(...raw.slice(i).filter(meaningful))
  return result
}

/** What the loader enforces for one line: [] when it may be published. */
export function lineProblems(line) {
  const problems = []
  if (/\u0000/.test(`${line.clean}${line.caption}`)) return ['contains a NUL character']
  const trace = traceClean(line.caption, line.clean)
  if (trace.cleanWords === 0) return ['the clean text has no words the check can read']
  const edited = trace.added.length > 0 || trace.dropped.length > 0 || trace.cutContext.length > 0
  const reviewed =
    Array.isArray(line.edits) && line.edits.some((e) => typeof e === 'string' && e.trim())
  if (edited && !reviewed) {
    const list = (xs) => xs.join(' ') || 'none'
    problems.push(
      `edited without a reviewed note (added: ${list(trace.added)}; dropped: ${list(trace.dropped)}; cut around the quote: ${list(trace.cutContext)})`,
    )
  }
  if (trace.added.length / trace.cleanWords > MAX_ADDED_SHARE) {
    problems.push(
      `${trace.added.length} of ${trace.cleanWords} words are not in the captions: a paraphrase, not a quote`,
    )
  }
  return problems
}
