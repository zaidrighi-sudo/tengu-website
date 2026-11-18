import mongoose, { Document, Schema } from 'mongoose'
import { resolveModel } from './_model-cache'

/** One product photo, linked to the colorway it shows. */
export interface IProductImage {
  image: mongoose.Types.ObjectId
  /** Color name this photo belongs to, e.g. "Black". */
  color: string
  /** HEX code stored alongside the color name for swatches. */
  colorHex?: string
  /** Position in the gallery; lower comes first. */
  order: number
  /** Exactly one image per product is the main/cover image. */
  isMain: boolean
}

/** Available stock for one color + size combination. */
export interface IInventoryItem {
  color: string
  colorHex?: string
  size: string
  quantity: number
}

export interface IProduct extends Document {
  name: string
  slug: string
  category: mongoose.Types.ObjectId
  price: number
  compareAt?: number
  sizes: string[]
  colors: mongoose.Types.ObjectId[]
  fit?: string
  image?: mongoose.Types.ObjectId
  hoverImage?: mongoose.Types.ObjectId
  /** Gallery of variant images, each linked to a color. */
  images: IProductImage[]
  /** Stock per color + size. Empty means stock is not tracked (legacy). */
  inventory: IInventoryItem[]
  status?: 'new' | 'sale' | 'soldout'
  active: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const ProductImageSchema = new Schema<IProductImage>({
  image: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
  color: { type: String, required: true, trim: true },
  colorHex: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
  order: { type: Number, default: 0 },
  isMain: { type: Boolean, default: false },
}, { _id: false })

const InventoryItemSchema = new Schema<IInventoryItem>({
  color: { type: String, required: true, trim: true },
  colorHex: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
  size: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
}, { _id: false })

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  compareAt: { type: Number, min: 0 },
  sizes: { type: [String], required: true, default: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  colors: [{ type: Schema.Types.ObjectId, ref: 'Color' }],
  fit: { type: String, enum: ['Oversized', 'Relaxed', 'Regular', 'Slim'] },
  image: { type: Schema.Types.ObjectId, ref: 'Media' },
  hoverImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  images: { type: [ProductImageSchema], default: [] },
  inventory: { type: [InventoryItemSchema], default: [] },
  status: { type: String, enum: ['new', 'sale', 'soldout'] },
  active: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
})

ProductSchema.index({ name: 'text', slug: 'text' })
ProductSchema.index({ category: 1, active: 1, sortOrder: 1 })

export const Product = resolveModel('Product', ProductSchema, 'products')
