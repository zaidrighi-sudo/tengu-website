import mongoose, { Document, Schema } from 'mongoose'

export interface ILocalizedText {
  en: string
  fr?: string
  ar?: string
}

export interface ISiteSettings extends Document {
  announcementLeft: ILocalizedText
  announcementCenter: ILocalizedText
  announcementRight: ILocalizedText
  heroImage?: mongoose.Types.ObjectId
  heroImageAlt?: string
  heroEyebrow: ILocalizedText
  heroCopy: ILocalizedText
  featuredProducts: mongoose.Types.ObjectId[]
  featuredCategories: mongoose.Types.ObjectId[]
  promoEnabled: boolean
  promoImage?: mongoose.Types.ObjectId
  promoImageAlt?: string
  promoHeadline: ILocalizedText
  promoSubtext: ILocalizedText
  promoCtaText: ILocalizedText
  promoCtaLink?: string
  promoAlignment: 'left' | 'center' | 'right'
  promoColorScheme: 'dark' | 'light'
  storyEnabled: boolean
  storyImage?: mongoose.Types.ObjectId
  storyImageAlt?: string
  storyHeadline: ILocalizedText
  storyBody: ILocalizedText
  storyCtaText: ILocalizedText
  storyCtaLink?: string
  newsletterEnabled: boolean
  newsletterHeadline: ILocalizedText
  newsletterSubtext: ILocalizedText
  newsletterPlaceholder: ILocalizedText
  newsletterButtonText: ILocalizedText
  contactEmail?: string
  phone?: string
  instagramUrl?: string
  createdAt: Date
  updatedAt: Date
}

const LocalizedTextSchema = new Schema<ILocalizedText>({
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
}, { _id: false })

const SiteSettingsSchema = new Schema<ISiteSettings>({
  announcementLeft: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  announcementCenter: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  announcementRight: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  heroImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  heroImageAlt: { type: String },
  heroEyebrow: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  heroCopy: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  featuredProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  featuredCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  promoEnabled: { type: Boolean, default: false },
  promoImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  promoImageAlt: { type: String },
  promoHeadline: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  promoSubtext: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  promoCtaText: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  promoCtaLink: { type: String },
  promoAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  promoColorScheme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  storyEnabled: { type: Boolean, default: true },
  storyImage: { type: Schema.Types.ObjectId, ref: 'Media' },
  storyImageAlt: { type: String },
  storyHeadline: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  storyBody: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  storyCtaText: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  storyCtaLink: { type: String },
  newsletterEnabled: { type: Boolean, default: true },
  newsletterHeadline: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  newsletterSubtext: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  newsletterPlaceholder: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  newsletterButtonText: { type: LocalizedTextSchema, default: () => ({ en: '' }) },
  contactEmail: { type: String },
  phone: { type: String },
  instagramUrl: { type: String },
}, {
  timestamps: true,
})

export const SiteSettings = mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema, 'site-settings')