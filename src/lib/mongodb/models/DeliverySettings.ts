import mongoose, { Document, Schema } from 'mongoose'
import { resolveModel } from './_model-cache'

export interface IZone {
  zone: number
  label?: string
  homeFee: number
  deskFee: number
  minDays: number
  maxDays: number
}

export interface ICommuneFee {
  /** Wilaya code, `01`–`69`. */
  wilayaCode: string
  /** Commune name (Latin `ascii` spelling from the static dataset). */
  commune: string
  homeFee: number
  deskFee: number
}

export interface IDeliverySettings extends Document {
  freeShippingThreshold: number
  /** Lifetime spend on delivered orders (DA) that unlocks free home delivery forever. 0 = disabled. */
  loyaltyFreeDeliveryThreshold: number
  zones: IZone[]
  /** Per-commune courier fees. Authoritative when a row exists; the zone fee is the fallback. */
  communeFees: ICommuneFee[]
  createdAt: Date
  updatedAt: Date
}

const ZoneSchema = new Schema<IZone>({
  zone: { type: Number, required: true, min: 1, max: 5 },
  label: { type: String },
  homeFee: { type: Number, required: true, min: 0 },
  deskFee: { type: Number, required: true, min: 0 },
  minDays: { type: Number, required: true, min: 1 },
  maxDays: { type: Number, required: true, min: 1 },
}, { _id: false })

const CommuneFeeSchema = new Schema<ICommuneFee>({
  wilayaCode: { type: String, required: true, match: /^\d{2}$/ },
  commune: { type: String, required: true, trim: true, maxlength: 120 },
  homeFee: { type: Number, required: true, min: 0 },
  deskFee: { type: Number, required: true, min: 0 },
}, { _id: false })

const DeliverySettingsSchema = new Schema<IDeliverySettings>({
  freeShippingThreshold: { type: Number, required: true, min: 0, default: 15000 },
  loyaltyFreeDeliveryThreshold: { type: Number, required: true, min: 0, default: 15000 },
  zones: { type: [ZoneSchema], required: true, validate: (v: IZone[]) => v.length >= 1 && v.length <= 5 },
  communeFees: { type: [CommuneFeeSchema], default: [] },
}, {
  timestamps: true,
})

export const DeliverySettings = resolveModel('DeliverySettings', DeliverySettingsSchema, 'delivery-settings', ['loyaltyFreeDeliveryThreshold'])
