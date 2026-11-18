/**
 * Import sanity check: every aliased (@/…) or relative import in src must
 * resolve to a real file. Catches broken imports without a full build.
 *
 * Usage: node scripts/check-imports.mjs
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
  else return { pkg: true }
  const cands = []
  if (path.extname(base)) cands.push(base)
  else {
    for (const e of exts) cands.push(base + e)
    for (const e of exts) cands.push(path.join(base, 'index' + e))
  }
  for (const c of cands) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return { file: path.normalize(c) }
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

const unresolved = []
for (const f of allFiles) {
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
    if (r === null) unresolved.push(`${path.relative(SRC, f)}  ->  ${spec}`)
  }
}

if (unresolved.length === 0) {
  console.log('OK: every aliased/relative import in src resolves to a file.')
  process.exit(0)
} else {
  console.log(`UNRESOLVED IMPORTS (${unresolved.length}):`)
  for (const u of unresolved.sort()) console.log('  ' + u)
  process.exit(1)
}
