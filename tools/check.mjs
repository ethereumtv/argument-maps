#!/usr/bin/env node
/*
 * Check Argument Map files without a database: shape, date order, unique
 * ids, contributor credit, and that every cleaned quote traces word by word
 * to its caption text. The transcript and saved-source checks run when a map
 * is loaded onto the site.
 *
 *   node tools/check.mjs maps/*.json
 */
import { readFileSync } from 'node:fs'
import { mapProblems } from './lib/argument-map-shape.mjs'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: node tools/check.mjs maps/<slug>.json [...]')
  process.exit(2)
}
let failed = 0
for (const file of files) {
  let map
  try {
    map = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`${file}: not valid JSON (${error.message})`)
    failed++
    continue
  }
  const problems = mapProblems(map)
  if (problems.length) {
    failed++
    console.error(`${file}: ${problems.length} problem(s)`)
    for (const p of problems) console.error(`  - ${p}`)
  } else console.log(`${file}: ok (${map.stops.length} stops)`)
}
process.exit(failed ? 1 : 0)
