/**
 * Restore a backup created by scripts/backup.mjs.
 *
 * DESTRUCTIVE: drops every collection found in the backup from the target
 * database and replaces it with the backup contents. The database to restore
 * into is DATABASE_URI from .env (or --uri).
 *
 * Usage: node scripts/restore.mjs backups/<timestamp> --confirm <exactDatabaseName> [--uri "mongodb://..."]
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
dotenv.config({ path: path.join(root, '.env') })

const args = process.argv.slice(2)
const dir = args[0]
const confirmIndex = args.indexOf('--confirm')
const confirmName = confirmIndex >= 0 ? args[confirmIndex + 1] : undefined
const uriIndex = args.indexOf('--uri')
const uri = (uriIndex >= 0 ? args[uriIndex + 1] : undefined) ?? process.env.DATABASE_URI

if (!dir || !fs.existsSync(path.join(root, dir, 'manifest.json'))) {
  console.error('Usage: node scripts/restore.mjs backups/<timestamp> --confirm <exactDatabaseName> [--uri "mongodb://..."]')
  process.exit(1)
}
if (!uri) {
  console.error('Set DATABASE_URI in .env or pass --uri.')
  process.exit(1)
}
if (!confirmName) {
  console.error('Refusing to restore without --confirm <exactDatabaseName> (e.g. --confirm tengu).')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, dir, 'manifest.json'), 'utf8'))

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
const db = mongoose.connection.db
if (!db) {
  console.error('Could not get a handle on the database.')
  process.exit(1)
}

const target = db.databaseName
if (confirmName !== target) {
  console.error(`--confirm "${confirmName}" does not match the target database "${target}". Aborting.`)
  await mongoose.disconnect()
  process.exit(1)
}

console.log(`Restoring backup "${dir}" into "${target}"…`)

const EJSON = mongoose.mongo.BSON.EJSON
for (const [name, count] of Object.entries(manifest.collections)) {
  const file = path.join(root, dir, `${name.replace(/[^\w.-]/g, '_')}.ejson`)
  if (!fs.existsSync(file)) {
    console.error(`  missing file for collection "${name}" (${file}). Aborting before any change.`)
    await mongoose.disconnect()
    process.exit(1)
  }
  const docs = EJSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(docs)) {
    console.error(`  collection "${name}" does not contain an array. Aborting before any change.`)
    await mongoose.disconnect()
    process.exit(1)
  }
  await db.collection(name).drop().catch(() => undefined)
  if (docs.length > 0) await db.collection(name).insertMany(docs, { ordered: false })
  console.log(`  ${name}: restored ${docs.length} document(s)`)
}

await mongoose.disconnect()
console.log('Restore complete.')
