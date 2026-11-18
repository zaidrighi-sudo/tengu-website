/**
 * Rehashes any plaintext passwords found in the users and admins collections.
 * Safe to re-run: scrypt hashes are recognised and left alone.
 *
 * Usage: node scripts/rehash-passwords.mjs
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(here, '..', '.env') })

const scryptAsync = promisify(scrypt)

const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64
const SALT_BYTES = 16

async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES)
  const key = await scryptAsync(password, salt, KEY_LENGTH, PARAMS)
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('hex')}$${key.toString('hex')}`
}

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI is not set. Add it to .env before running this script.')
  process.exit(1)
}

await mongoose.connect(uri, { tls: true, serverSelectionTimeoutMS: 30000 })
const db = mongoose.connection.db

let upgraded = 0
for (const collection of ['users', 'admins']) {
  const docs = await db.collection(collection).find({}).toArray()
  console.log(`\n[${collection}] ${docs.length} documents to inspect`)
  for (const doc of docs) {
    const current = doc.password
    if (!current) {
      console.log(`  skip ${String(doc._id)}: no password`)
      continue
    }
    if (current.startsWith('scrypt$')) {
      console.log(`  skip ${String(doc._id)}: already hashed`)
      continue
    }
    const hashed = await hashPassword(current)
    await db.collection(collection).updateOne({ _id: doc._id }, { $set: { password: hashed } })
    console.log(`  upgraded ${String(doc._id)}`)
    upgraded++
  }
}

console.log(`\nDone. ${upgraded} plaintext password(s) re-hashed.`)
await mongoose.disconnect()
