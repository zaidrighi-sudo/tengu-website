import mongoose, { Document, Schema } from 'mongoose'

export interface IAddress {
  label: string
  isDefault: boolean
  firstName?: string
  lastName?: string
  phone?: string
  region?: string
  city?: string
  address1?: string
  address2?: string
}

export interface IUser extends Document {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  marketing: boolean
  loyaltyPoints: number
  addresses: IAddress[]
  createdAt: Date
  updatedAt: Date
  // OAuth fields
  googleId?: string
  provider?: 'local' | 'google'
  avatar?: string
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  region: { type: String },
  city: { type: String },
  address1: { type: String },
  address2: { type: String },
}, { _id: false })

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String }, // Optional for OAuth users
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  marketing: { type: Boolean, default: false },
  loyaltyPoints: { type: Number, default: 0 },
  addresses: { type: [AddressSchema], default: [] },
  // OAuth fields
  googleId: { type: String, index: true, sparse: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String },
}, {
  timestamps: true,
})

UserSchema.index({ createdAt: -1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users')