// Shared internals for the admin server actions. Plain module (no "use server"):
// only the action modules export async functions; this one holds helpers, types and cache tags.
import mongoose from 'mongoose'
import { connectDB } from "@/shared/mongodb/models"
import {
  type IProduct, type ICategory, type IOrder, type IUser, type IColor,
  type IMessage, type ISubscriber, type ISiteSettings, type IDeliverySettings
} from "@/shared/mongodb/models"
import { revalidateTag } from "next/cache"

/** Storefront data is cached with this tag; admin edits must expire it. */
const STORE_TAG = "store-data"

export function refreshStorefront() {
  revalidateTag(STORE_TAG, "max")
}

export type LeanProduct = Omit<IProduct, 'category' | 'colors' | 'image' | 'hoverImage' | 'images' | 'inventory'> & {
  _id: string
  category?: { _id: string; name: string; slug: string }
  colors?: Array<{ _id: string; name: string; hex: string }>
  image?: { _id: string; url: string; filename: string }
  hoverImage?: { _id: string; url: string; filename: string }
  images?: Array<{
    image?: { _id: string; url: string; filename: string }
    color: string
    colorHex?: string
    order: number
    isMain: boolean
  }>
  inventory?: Array<{ color: string; colorHex?: string; size: string; quantity: number }>
}

type VariantImageInput = {
  mediaId?: string
  image?: string
  color?: string
  colorHex?: string
  isMain?: boolean
  order?: number
}

type InventoryInput = {
  color?: string
  colorHex?: string
  size?: string
  quantity?: number
}

/**
 * Turns the admin form's variant payload into database fields: a normalized
 * image gallery (exactly one main image, ordered) and color+size inventory.
 * Also derives the legacy `image`/`hoverImage`/`sizes` fields other parts of
 * the app still read.
 */
export function buildVariantFields(data: Record<string, unknown>) {
  const rawImages = Array.isArray(data.images) ? (data.images as VariantImageInput[]) : []
  const images = rawImages
    .map((item, index) => ({
      image: String(item?.mediaId ?? item?.image ?? '').trim(),
      color: String(item?.color ?? '').trim(),
      colorHex: item?.colorHex,
      order: Number.isFinite(Number(item?.order)) ? Number(item?.order) : index,
      isMain: Boolean(item?.isMain),
    }))
    .filter((item) => item.image && item.color)
    .sort((a, b) => a.order - b.order)

  if (images.length > 0) {
    const mainIndex = images.findIndex((item) => item.isMain)
    images.forEach((item, index) => {
      item.order = index
      item.isMain = index === (mainIndex >= 0 ? mainIndex : 0)
    })
  }

  const rawInventory = Array.isArray(data.inventory) ? (data.inventory as InventoryInput[]) : []
  const seen = new Set<string>()
  const inventory = rawInventory
    .map((item) => ({
      color: String(item?.color ?? '').trim(),
      colorHex: item?.colorHex,
      size: String(item?.size ?? '').trim(),
      quantity: Math.max(0, Math.trunc(Number(item?.quantity) || 0)),
    }))
    .filter((item) => {
      if (!item.color || !item.size) return false
      const key = `${item.color}\u0000${item.size}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const fields: Record<string, unknown> = {}
  if (Array.isArray(data.images)) {
    fields.images = images.map((item) => ({ ...item, image: toObjectId(item.image) }))
  }
  if (Array.isArray(data.inventory)) {
    fields.inventory = inventory
  }

  const main = images.find((item) => item.isMain) ?? images[0]
  if (main) {
    fields.image = toObjectId(main.image)
    // `null` clears a stale hover image when the gallery shrinks.
    fields.hoverImage = images[1] ? toObjectId(images[1].image) : null
    const sizes = [...new Set(inventory.map((item) => item.size))]
    if (sizes.length) fields.sizes = sizes
  }
  return fields
}

export type LeanSizeRange = {
  size: string
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
}

export type LeanCategory = Omit<ICategory, 'tileImage' | 'tileHoverImage' | 'sizeChart'> & {
  _id: string
  tileImage?: { _id: string; url: string } | null
  tileHoverImage?: { _id: string; url: string } | null
  sizeChart?: LeanSizeRange[]
  showInNav: boolean
}

export type LeanOrder = Omit<IOrder, 'user' | 'lines'> & {
  _id: string
  user?: { _id: string; email: string }
  lines?: Array<{
    /** ObjectId on the raw document; the populated product when getOrder() loads it. */
    product: { _id: string; name?: string; slug?: string } | string
    /** Product name captured at the time of the order. */
    name: string
    color?: string
    size: string
    qty: number
    unitPrice: number
  }>
  customer: IOrder['customer']
}

export type LeanUser = Omit<IUser, never> & { _id: string }

export type LeanColor = Omit<IColor, never> & { _id: string }

export type LeanMessage = Omit<IMessage, never> & { _id: string }

export type LeanSubscriber = Omit<ISubscriber, never> & { _id: string }

export type LeanSiteSettings = Omit<ISiteSettings, 'heroImage' | 'promoImage' | 'storyImage' | 'featuredProducts' | 'featuredCategories'> & {
  _id: string
  heroImage?: { _id: string; url: string } | null
  promoImage?: { _id: string; url: string } | null
  storyImage?: { _id: string; url: string } | null
  featuredProducts?: Array<{ _id: string; name: string; slug: string }>
  featuredCategories?: Array<{ _id: string; name: string; slug: string }>
}

export type LeanDeliverySettings = Omit<IDeliverySettings, never> & { _id: string }

export type PaginatedResult<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
}

// Helper to ensure DB connection
export async function ensureDB() {
  await connectDB()
}

// Helper to convert string to ObjectId
export function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

/** URL-safe slug used when the form leaves the slug field empty. */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
