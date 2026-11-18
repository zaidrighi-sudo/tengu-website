import mongoose, { Document, Schema } from 'mongoose'
import { resolveModel } from './_model-cache'

export interface IOrderLine {
  product: mongoose.Types.ObjectId
  name: string
  /** Colorway the customer picked. Missing on orders placed before variants. */
  color?: string
  size: string
  qty: number
  unitPrice: number
}

export interface ICustomer {
  firstName: string
  lastName: string
  phone: string
}

export interface IAddress {
  wilaya: string
  commune: string
  street: string
  landmark?: string
}

export interface IOrder extends Document {
  number: string
  user?: mongoose.Types.ObjectId
  status: 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  customer: ICustomer
  address: IAddress
  deliveryMethod: 'home' | 'desk'
  deliveryDays?: string
  lines: IOrderLine[]
  note?: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  loyaltyPointsRedeemed: boolean
  loyaltyPointsUsed: number
  /** True when this order got free home delivery from the lifetime-spend loyalty reward. */
  loyaltyFreeDelivery?: boolean
  internalNotes?: string
  createdAt: Date
  updatedAt: Date
}

const OrderLineSchema = new Schema<IOrderLine>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  color: { type: String },
  size: { type: String, required: true },
  qty: { type: Number, required: true, min: 1, max: 9 },
  unitPrice: { type: Number, required: true },
}, { _id: false })

const CustomerSchema = new Schema<ICustomer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false })

const AddressSchema = new Schema<IAddress>({
  wilaya: { type: String, required: true },
  commune: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String },
}, { _id: false })

const OrderSchema = new Schema<IOrder>({
  number: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  status: {
    type: String,
    enum: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'new',
    index: true,
  },
  customer: { type: CustomerSchema, required: true },
  address: { type: AddressSchema, required: true },
  deliveryMethod: { type: String, enum: ['home', 'desk'], default: 'home' },
  deliveryDays: { type: String },
  lines: { type: [OrderLineSchema], required: true, validate: (v: IOrderLine[]) => v.length > 0 },
  note: { type: String },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  loyaltyPointsRedeemed: { type: Boolean, default: false },
  loyaltyPointsUsed: { type: Number, default: 0 },
  loyaltyFreeDelivery: { type: Boolean, default: false },
  internalNotes: { type: String },
}, {
  timestamps: true,
})

OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

export const Order = resolveModel('Order', OrderSchema, 'orders')