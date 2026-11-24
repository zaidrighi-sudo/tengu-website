import { unsplash as U } from "@/shared/utils/images"
import { cmsColors } from "@/features/site-settings/data"

export type ProductStatus = "new" | "sale" | "soldout"

// ColorName is now dynamic from CMS - use string type
export type ColorName = string

/** Sizes are free-form so shops can add numeric sizes like 38, 40, 42. */
export type Size = string

export type Fit = "Oversized" | "Relaxed" | "Regular" | "Slim"

/** One gallery image, linked to the colorway it shows. */
export type ProductImage = {
  url: string
  color: ColorName
  colorHex?: string
  order?: number
  isMain?: boolean
}

/** Stock for one color + size combination. */
export type InventoryItem = {
  color: ColorName
  colorHex?: string
  size: Size
  quantity: number
}

export type Product = {
  id: string
  /** URL slug for the real /product/<slug> route. Missing on legacy entries. */
  slug?: string
  name: string
  category: string
  /** Primary colorway, shown in the bag. */
  color: ColorName
  colors: ColorName[]
  sizes: Size[]
  /** Accessories have no fit. */
  fit?: Fit
  price: number
  compareAt?: number
  status?: ProductStatus
  image: string
  hoverImage: string
  /** Variant gallery. Falls back to `image`/`hoverImage` when absent. */
  images?: ProductImage[]
  /** Per color + size stock. Empty/absent means stock is not tracked. */
  inventory?: InventoryItem[]
  /** ISO timestamp of when the product was added to the catalogue. */
  createdAt?: string
}

/**
 * How long a freshly added product stays in "New in", in days.
 * Override with NEXT_PUBLIC_NEW_IN_DAYS (e.g. 45) without touching code.
 */
export const NEW_IN_DAYS = Number(process.env.NEXT_PUBLIC_NEW_IN_DAYS) || 30

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A product is "new in" while it is younger than the New In window.
 * Computed live from `createdAt`, so pieces enter the collection the moment
 * they are added and drop out automatically once the window passes — with no
 * cron job and no manual list to maintain. The piece itself is untouched and
 * keeps living in its own category.
 */
export function isNewIn(
  product: Pick<Product, "createdAt">,
  now: number = Date.now(),
): boolean {
  if (!product.createdAt) return false
  const added = Date.parse(product.createdAt)
  if (!Number.isFinite(added)) return false
  const age = now - added
  // Tolerate up to a day of clock skew into the future, then expire normally.
  return age > -DAY_MS && age < NEW_IN_DAYS * DAY_MS
}

/** Dynamic color swatches from CMS. Filled by hydrateStore. */
export const colorSwatches: Record<string, string> = {}

/** Dynamic color options from CMS. Filled by hydrateStore. */
export const colorOptions: string[] = []

export const sizeOptions: Size[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "One size",
]
export const fitOptions: Fit[] = ["Oversized", "Relaxed", "Regular", "Slim"]
/** Category names, in shop order. Filled from the CMS by `hydrateStore`. */
export const shopCategories: string[] = []

/** Update color swatches and options from CMS colors. */
export function updateColorsFromCMS() {
  // Clear existing
  Object.keys(colorSwatches).forEach((key) => delete colorSwatches[key])
  colorOptions.splice(0, colorOptions.length)

  // Add active CMS colors, sorted by sortOrder
  const activeColors = cmsColors.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  for (const color of activeColors) {
    colorSwatches[color.name] = color.hex
    colorOptions.push(color.name)
  }
}

export const photos = {
  hero: U("1677538537484-324385aff147", 2000, 85),
  // Lookbook: one wide, one tall, one mid, one small.
  lookA: U("1617869884925-f8f0a51b2374", 1800, 85),
  lookB: U("1631297659547-c9623fef39ee", 1200, 85),
  lookC: U("1785508889038-1fb7a6408dd5", 1400, 85),
  lookD: U("1598820728031-93a209579602", 1000, 85),
  story: U("1701518358370-22ce0e925e06", 1800, 80),
}

/** Sizes a customer can pick on clothing, in order. */
export const APPAREL: Size[] = ["S", "M", "L", "XL", "XXL", "XXXL"]
/** The catalogue. Filled in place from the CMS by `hydrateStore` before the app renders. */
export const products: Product[] = []

export type Category = {
  name: string
  href: string
  image: string
  hoverImage: string
  alt: string
  showInNav?: boolean
}

/** Home category tiles (categories that have a photo). Filled from the CMS. */
export const categoryTiles: Category[] = []

/** Marquee words. `jp` items render in the Japanese subset font. */
export const marqueeItems = [
  { text: "New drop" },
  { text: "新作", jp: true },
  { text: "Free shipping" },
  { text: "天狗", jp: true },
]
