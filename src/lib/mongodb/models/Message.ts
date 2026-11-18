import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  name: string
  email: string
  topic: string
  orderNumber?: string
  message: string
  status: 'new' | 'answered' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  name: { type: String, required: true, maxlength: 120 },
  email: { type: String, required: true, maxlength: 200, lowercase: true },
  topic: { type: String, required: true, maxlength: 80 },
  orderNumber: { type: String, maxlength: 40 },
  message: { type: String, required: true, maxlength: 4000 },
  status: {
    type: String,
    enum: ['new', 'answered', 'archived'],
    default: 'new',
    index: true,
  },
}, {
  timestamps: true,
})

MessageSchema.index({ createdAt: -1 })

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema, 'messages')