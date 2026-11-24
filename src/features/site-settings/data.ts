import { type Zone, ZONES } from "@/features/delivery/algeria"
import { COMMUNE_FEES, communeFeeKey } from "@/features/delivery/communes"
import { setFreeShippingThreshold, setLoyaltyFreeDeliveryThreshold, socials, setPrimaryLinks, setFooterShopLinks, setMegaMenu } from "@/features/site-settings/navigation"
import {
  type Category,
  type Product,
  categoryTiles,
  photos,
  products,
  shopCategories,
  updateColorsFromCMS,
} from "@/features/products/products"
import { getLang } from "@/shared/i18n/core"

export type CMSSizeRange = {
  size: string
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
}

export type CMSColor = {
  name: string
  hex: string
  sortOrder: number
  isActive: boolean
}

/** One piece of copy in each site language. Empty languages fall back to English. */
export type LocalizedText = { en?: string | null; fr?: string | null; ar?: string | null }

/** Everything the storefront needs from the CMS, as plain serialisable data. */
export type StoreData = {
  products: Product[]
  categories: {
    id?: string;
    name: string;
    sortOrder?: number;
    tileImage?: string;
    tileHoverImage?: string;
    tileAlt?: string;
    sizeChart?: CMSSizeRange[]
    showInNav?: boolean;
  }[]
  zones: Zone[]
  /** Sparse per-commune courier fee overrides; win over the zone fees once hydrated. */
  communeFees?: { wilayaCode: string; commune: string; home: number; desk: number }[]
  freeShippingThreshold: number
  /** Lifetime delivered spend (DA) that unlocks free home delivery. 0 disables the reward. */
  loyaltyFreeDeliveryThreshold: number
  colors: CMSColor[]
  settings: {
    // Announcement bar
    announcementLeft: LocalizedText
    announcementCenter: LocalizedText
    announcementRight: LocalizedText
    // Home hero
    heroImage?: string
    heroImageAlt?: string
    heroEyebrow: LocalizedText
    heroCopy: LocalizedText
    // Featured products
    featuredProducts?: string[]
    // Featured categories
    featuredCategories?: string[]
    // Categories curated for the SHOP mega menu (empty = show all)
    megaMenuCategories?: string[]
    // Promotional banner
    promoEnabled?: boolean
    promoImage?: string
    promoImageAlt?: string
    promoHeadline: LocalizedText
    promoSubtext: LocalizedText
    promoCtaText: LocalizedText
    promoCtaLink?: string
    promoAlignment?: 'left' | 'center' | 'right'
    promoColorScheme?: 'dark' | 'light'
    // Brand story
    storyEnabled?: boolean
    storyImage?: string
    storyImageAlt?: string
    storyHeadline: LocalizedText
    storyBody: LocalizedText
    storyCtaText: LocalizedText
    storyCtaLink?: string
    // Newsletter
    newsletterEnabled?: boolean
    newsletterHeadline: LocalizedText
    newsletterSubtext: LocalizedText
    newsletterPlaceholder: LocalizedText
    newsletterButtonText: LocalizedText
    // Contact
    contactEmail?: string
    phone?: string
    instagramUrl?: string
  }
}

const empty: LocalizedText = {}

/** Live site settings, replaced in place by `hydrateStore`. */
export const siteSettings: StoreData["settings"] = {
  announcementLeft: empty,
  announcementCenter: empty,
  announcementRight: empty,
  heroEyebrow: empty,
  heroCopy: empty,
  promoHeadline: empty,
  promoSubtext: empty,
  promoCtaText: empty,
  storyHeadline: empty,
  storyBody: empty,
  storyCtaText: empty,
  newsletterHeadline: empty,
  newsletterSubtext: empty,
  newsletterPlaceholder: empty,
  newsletterButtonText: empty,
}

/** Live colors from CMS, replaced in place by `hydrateStore`. */
export const cmsColors: CMSColor[] = []

/** Category size charts from CMS, keyed by category name. Updated by `hydrateStore`. */
export const categorySizeCharts: Record<string, CMSSizeRange[]> = {}

/** Support address shown in the footer of checkout and on the contact page. */
export const contactEmail = () => siteSettings.contactEmail || "studio@tengu.example"

/** Copy in the current language, or `fallback` (already translated) when the CMS has none. */
export function localized(text: LocalizedText | undefined, fallback: string) {
  const value = text?.[getLang()] || text?.en
  return value && value.trim() ? value : fallback
}

/**
 * Load CMS data into the module-level stores the app reads from. Runs once,
 * before the first render, with data fetched on the server.
 */
export function hydrateStore(data: StoreData) {
  products.splice(0, products.length, ...data.products)

  shopCategories.splice(0, shopCategories.length, ...data.categories.map((category) => category.name))

  const tiles: Category[] = data.categories
    .filter((category) => category.tileImage)
    .map((category) => ({
      name: category.name,
      href: `#/shop?category=${encodeURIComponent(category.name)}`,
      image: category.tileImage as string,
      hoverImage: category.tileHoverImage || (category.tileImage as string),
      alt: category.tileAlt || category.name,
      showInNav: category.showInNav !== false,
    }))
  categoryTiles.splice(0, categoryTiles.length, ...tiles)

  // Top navigation comes from CMS categories flagged "Show in top navigation".
  setPrimaryLinks(data.categories)
  // Footer "Shop" column uses the same categories.
  setFooterShopLinks(data.categories)
  // Shop mega menu: quick links + one image card per category with a tile image.
  setMegaMenu(data.categories, data.settings.megaMenuCategories)

  for (const zone of data.zones) ZONES[zone.id] = zone
  // Sparse commune overrides: replace the map wholesale.
  for (const key of Object.keys(COMMUNE_FEES)) delete COMMUNE_FEES[key]
  for (const row of data.communeFees ?? []) {
    COMMUNE_FEES[communeFeeKey(row.wilayaCode, row.commune)] = { home: row.home, desk: row.desk }
  }

  setFreeShippingThreshold(data.freeShippingThreshold)
  setLoyaltyFreeDeliveryThreshold(data.loyaltyFreeDeliveryThreshold ?? 15000)
  if (data.settings.instagramUrl) socials[0].href = data.settings.instagramUrl
  Object.assign(siteSettings, data.settings)
  if (data.settings.heroImage) photos.hero = data.settings.heroImage

  // Update colors from CMS
  cmsColors.splice(0, cmsColors.length, ...data.colors)
  updateColorsFromCMS()

  // Update category size charts from CMS
  Object.keys(categorySizeCharts).forEach(key => delete categorySizeCharts[key])
  for (const category of data.categories) {
    if (category.sizeChart && category.sizeChart.length > 0) {
      categorySizeCharts[category.name] = category.sizeChart
    }
  }
}

/**
 * Get featured products based on CMS-selected product IDs.
 * Falls back to "new" status products if no featured products are selected.
 */
export function getFeaturedProducts(): Product[] {
  if (siteSettings.featuredProducts && siteSettings.featuredProducts.length > 0) {
    return products.filter((p) => siteSettings.featuredProducts!.includes(p.id))
  }
  // Fallback: newest pieces first, sold-out excluded
  return products
    .filter((product) => product.status !== "soldout")
    .sort((a, b) => Number(b.status === "new") - Number(a.status === "new"))
    .slice(0, 6)
}

/**
 * Get featured categories based on CMS-selected category names.
 * Falls back to all categories with images if none selected.
 */
export function getFeaturedCategories(): Category[] {
  if (siteSettings.featuredCategories && siteSettings.featuredCategories.length > 0) {
    return categoryTiles.filter((tile) => siteSettings.featuredCategories!.includes(tile.name))
  }
  return categoryTiles
}
