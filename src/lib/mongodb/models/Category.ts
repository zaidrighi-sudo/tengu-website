import mongoose, { Document, Schema } from 'mongoose'

/** Size range for a specific size in a category's size chart */
export interface ISizeRange {
  size: string
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
}

export interface ICategory extends Document {
  name: string
  slug: string
  sortOrder: number
  tileImage?: mongoose.Types.ObjectId
  tileHoverImage?: mongoose.Types.ObjectId
  tileAlt?: string
  /** Custom size chart for this category (optional) */
  sizeChart?: ISizeRange[]
  createdAt: Date
  updatedAt: Date
}

const SizeRangeSchema = new Schema<ISizeRange>({
  size: { type: String, required: true },
  minHeight: { type: Number, required: true, min: 50, max: 300 },
  maxHeight: { type: Number, required: true, min: 50, max: 300 },
  minWeight: { type: Number, required: true, min: 20, max: 300 },
  maxWeight: { type: Number, required: true, min: 20, max: 300 },
}, { _id: false })

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  sortOrder: { type: Number, default: 0 },
  tileImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  tileHoverImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  tileAlt: { type: String },
  sizeChart: { type: [SizeRangeSchema], default: undefined },
}, {
  timestamps: true,
})

CategorySchema.index({ sortOrder: 1 })

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema, 'categories')