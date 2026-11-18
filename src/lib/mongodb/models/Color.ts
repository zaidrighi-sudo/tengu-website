import { Document, Schema } from 'mongoose'
import { resolveModel } from './_model-cache'

export interface IColor extends Document {
  name: string
  hex: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ColorSchema = new Schema<IColor>({
  name: { type: String, required: true, unique: true, index: true },
  hex: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
})

ColorSchema.index({ sortOrder: 1 })

export const Color = resolveModel('Color', ColorSchema, 'colors')