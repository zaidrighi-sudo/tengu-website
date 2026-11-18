import { Document, Schema } from 'mongoose'
import { resolveModel } from '@/shared/mongodb/model-cache'

export interface IAdmin extends Document {
  email: string
  password: string
  firstName?: string
  lastName?: string
  roles?: string[]
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  roles: { type: [String], default: ['admin'] },
}, {
  timestamps: true,
})

export const Admin = resolveModel('Admin', AdminSchema, 'admins')