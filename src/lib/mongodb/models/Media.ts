import { Document, Schema } from 'mongoose'
import { resolveModel } from './_model-cache'

export interface IMedia extends Document {
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  alt?: string
  /** Raw bytes for images uploaded from the admin dashboard. */
  data?: Buffer
  createdAt: Date
  updatedAt: Date
}

const MediaSchema = new Schema<IMedia>({
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  filesize: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  url: { type: String, required: true },
  alt: { type: String },
  // Hidden from normal queries so listing media never loads whole files.
  data: { type: Buffer, select: false },
}, {
  timestamps: true,
})

export const Media = resolveModel('Media', MediaSchema, 'media')
