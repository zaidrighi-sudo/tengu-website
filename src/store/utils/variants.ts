import {
  type Product,
  type ProductImage,
  type Size,
  colorSwatches,
} from "@/store/data/products"

/** True when a product carries explicit per color + size stock. */
export function isStockTracked(product: Product): boolean {
  return Array.isArray(product.inventory) && product.inventory.length > 0
}

/** Gallery images in display order, preferring the main image first. */
export function orderedImages(product: Product): ProductImage[] {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return [...product.images].sort((a, b) => {
      const order = (a.order ?? 0) - (b.order ?? 0)
      if (order !== 0) return order
      return Number(Boolean(b.isMain)) - Number(Boolean(a.isMain))
    })
  }
  // Legacy products only have a single image (and optional hover image).
  const fallback: ProductImage[] = []
  if (product.image) {
    fallback.push({ url: product.image, color: product.color || "", isMain: true, order: 0 })
  }
  if (product.hoverImage && product.hoverImage !== product.image) {
    fallback.push({ url: product.hoverImage, color: product.color || "", order: 1 })
  }
  return fallback
}

/** Images that belong to a colorway, falling back to the whole gallery. */
export function imagesForColor(product: Product, color: string): ProductImage[] {
  const all = orderedImages(product)
  const own = all.filter((image) => image.color === color)
  return own.length > 0 ? own : all
}

/** All colorways a product is sold in, in a stable order. */
export function colorsForProduct(product: Product): string[] {
  const seen = new Set<string>()
  const add = (value: string | undefined) => {
    if (value && value.trim()) seen.add(value)
  }
  for (const image of orderedImages(product)) add(image.color)
  for (const item of product.inventory ?? []) add(item.color)
  for (const color of product.colors ?? []) add(color)
  return [...seen]
}

/** Color used when the product page first opens. */
export function defaultColor(product: Product): string {
  const colors = colorsForProduct(product)
  if (colors.length > 0) {
    // Prefer the first color that still has stock.
    if (isStockTracked(product)) {
      const inStock = colors.find((color) =>
        (product.inventory ?? []).some((item) => item.color === color && item.quantity > 0),
      )
      if (inStock) return inStock
    }
    return colors[0]
  }
  return product.color || ""
}

/** HEX for a color, preferring the product's own stored value over the CMS map. */
export function colorHexFor(product: Product, color: string): string {
  const fromImage = product.images?.find((image) => image.color === color)?.colorHex
  if (fromImage) return fromImage
  const fromInventory = product.inventory?.find((item) => item.color === color)?.colorHex
  if (fromInventory) return fromInventory
  return colorSwatches[color] ?? "#000000"
}

export type SizeStock = {
  size: Size
  quantity: number
  available: boolean
}

/**
 * Sizes and stock for one color. Untracked (legacy) products keep the old
 * behaviour: every published size is available.
 */
export function sizesForColor(product: Product, color: string): SizeStock[] {
  if (!isStockTracked(product)) {
    return (product.sizes ?? []).map((size) => ({
      size,
      quantity: Infinity,
      available: product.status !== "soldout",
    }))
  }

  const order = product.sizes ?? []
  return (product.inventory ?? [])
    .filter((item) => item.color === color)
    .slice()
    .sort((a, b) => {
      const ai = order.indexOf(a.size)
      const bi = order.indexOf(b.size)
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi)
    })
    .map((item) => ({
      size: item.size,
      quantity: item.quantity,
      available: item.quantity > 0,
    }))
}

/** Stock for a color + size. `Infinity` means stock is not tracked. */
export function stockFor(product: Product, color: string, size: string): number {
  if (!isStockTracked(product)) return Infinity
  const item = (product.inventory ?? []).find(
    (candidate) => candidate.color === color && candidate.size === size,
  )
  return item ? item.quantity : 0
}

/** True when at least one size of the product is in stock. */
export function hasStock(product: Product): boolean {
  if (!isStockTracked(product)) return product.status !== "soldout"
  return (product.inventory ?? []).some((item) => item.quantity > 0)
}

/** True when the product has exactly one published size. */
export function isOneSizeProduct(product: Product): boolean {
  return product.sizes.length === 1
}
