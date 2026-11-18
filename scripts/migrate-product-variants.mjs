/**
 * Migrates products to the variant structure.
 *
 * Safe to run more than once: it only fills in what is missing.
 *  - `images` gets the legacy `image` / `hoverImage` as the first gallery
 *    entries, linked to the product's first color.
 *  - `inventory` is added as an empty array, which means "stock not tracked",
 *    so existing products keep their current storefront availability.
 *
 * Neither legacy field is removed, so older code keeps working.
 *
 * Usage: pnpm migrate:variants
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(here, '..', '.env') })

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('DATABASE_URI is not set. Add it to .env before running the migration.')
  process.exit(1)
}

await mongoose.connect(uri, { tls: true, serverSelectionTimeoutMS: 30000 })
const db = mongoose.connection.db

try {
  const colors = await db.collection('colors').find({}).project({ name: 1, hex: 1 }).toArray()
  const colorById = new Map(colors.map((color) => [String(color._id), color]))

  const products = db.collection('products')
  const cursor = products.find({})

  let scanned = 0
  let updated = 0

  for await (const doc of cursor) {
    scanned++
    const hasImages = Array.isArray(doc.images) && doc.images.length > 0
    const set = {}

    if (!Array.isArray(doc.inventory)) set.inventory = []

    if (!hasImages) {
      const color =
        Array.isArray(doc.colors) && doc.colors.length > 0
          ? colorById.get(String(doc.colors[0]))
          : undefined

      const mediaIds = [doc.image, doc.hoverImage].filter(Boolean)
      set.images = mediaIds.map((image, index) => ({
        image,
        color: color?.name ?? '',
        ...(color?.hex ? { colorHex: color.hex } : {}),
        order: index,
        isMain: index === 0,
      }))
    }

    if (Object.keys(set).length > 0) {
      await products.updateOne({ _id: doc._id }, { $set: set })
      updated++
    }
  }

  console.log(`Scanned ${scanned} product(s); updated ${updated}.`)
} finally {
  await mongoose.disconnect()
}
