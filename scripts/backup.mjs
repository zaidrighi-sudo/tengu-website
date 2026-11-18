/**
 * Database backup: exports every collection in DATABASE_URI to
 * backups/<timestamp>/<collection>.ejson (full-fidelity EJSON) plus a
 * manifest.json with counts. Read-only against the database.
 *
 * Usage: node scripts/backup.mjs
 * Restore (overwrites the target database!): node scripts/restore.mjs backups/<timestamp> --confirm <dbName>
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
dotenv.config({ path: path.join(root, '.env') })

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI is not set. Add it to .env before running a backup.')
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = path.join(root, 'backups', stamp)

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
const db = mongoose.connection.db
if (!db) {
  console.error('Could not get a handle on the database.')
  process.exit(1)
}

const dbName = db.databaseName
const collections = (await db.listCollections().toArray()).map((c) => c.name).sort()

if (collections.length === 0) {
  console.error(`No collections found in "${dbName}".`)
  await mongoose.disconnect()
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const EJSON = mongoose.mongo.BSON.EJSON
const manifest = { database: dbName, createdAt: new Date().toISOString(), collections: {} }

for (const name of collections) {
  const docs = await db.collection(name).find().toArray()
  const safeName = name.replace(/[^\w.-]/g, '_')
  fs.writeFileSync(path.join(outDir, `${safeName}.ejson`), EJSON.stringify(docs))
  manifest.collections[name] = docs.length
  console.log(`  ${name}: ${docs.length} document(s)`)
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
await mongoose.disconnect()

console.log(`\nBackup of "${dbName}" written to backups/${stamp}/`)
console.log('NOTE: backups contain customer data and password hashes. They are gitignored —')
console.log('keep them local or in an encrypted store; never commit them.')
