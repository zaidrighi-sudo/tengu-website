import mongoose, { Document, Schema } from 'mongoose'

export interface ISubscriber extends Document {
  email: string
  language: 'en' | 'fr' | 'ar'
  createdAt: Date
  updatedAt: Date
}

const SubscriberSchema = new Schema<ISubscriber>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true, maxlength: 200 },
  language: { type: String, enum: ['en', 'fr', 'ar'], default: 'en' },
}, {
  timestamps: true,
})

SubscriberSchema.index({ createdAt: -1 })

export const Subscriber = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema, 'subscribers')