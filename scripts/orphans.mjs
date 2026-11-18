/**
 * Orphan scan: lists src files unreachable from the app/, store/, lib/ and
 * components/ entry trees. A file listed here is dead code candidate —
 * double-check before deleting (dynamic imports and route handlers may not
 * be statically visible).
 *
 * Usage: node scripts/orphans.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css']
const importRe = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g

function resolveSpec(spec, fromFile) {
  let base = null
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return null
  const cands = []
  if (path.extname(base)) cands.push(base)
  else {
    for (const e of exts) cands.push(base + e)
    for (const e of exts) cands.push(path.join(base, 'index' + e))
  }
  for (const c of cands) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return path.normalize(c)
  }
  return null
}

const allFiles = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) allFiles.push(path.normalize(p))
  }
})(SRC)

const entryDirs = ['app', 'store', 'lib', 'components'].map((d) => path.normalize(path.join(SRC, d)) + path.sep)
const seen = new Set()
const queue = allFiles.filter((f) => entryDirs.some((d) => f.startsWith(d)))
while (queue.length) {
  const f = queue.pop()
  if (seen.has(f)) continue
  seen.add(f)
  let src
  try {
    src = fs.readFileSync(f, 'utf8')
  } catch {
    continue
  }
  let m
  importRe.lastIndex = 0
  while ((m = importRe.exec(src))) {
    const spec = m[1] || m[2] || m[3]
    if (!spec) continue
    const r = resolveSpec(spec, f)
    if (r && !seen.has(r) && /\.(ts|tsx|js|jsx|mjs)$/.test(r)) queue.push(r)
  }
}

const orphans = allFiles.filter((f) => !seen.has(f))
console.log(`ALL UNREACHABLE src files (${orphans.length}):`)
for (const f of orphans.sort()) console.log('  ' + path.relative(SRC, f))
