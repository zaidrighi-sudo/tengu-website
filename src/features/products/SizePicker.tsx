import { APPAREL, type Product, type Size } from "@/features/products/products"
import { t, tr } from "@/shared/i18n"
import { cn } from "@/shared/utils/cn"
import { defaultColor, isStockTracked, sizesForColor, stockFor } from "@/features/products/variants"

/**
 * Sizes to show for a product and color. Tracked products list exactly the
 * sizes sold in that color, including custom sizes like 38 or 42. Untracked
 * (legacy) products keep the fixed apparel run plus any custom sizes.
 */
export const sizesToShow = (product: Product, color?: string): Size[] => {
  if (product.sizes.includes("One size")) return ["One size"]

  if (isStockTracked(product)) {
    const sizes = sizesForColor(product, color ?? defaultColor(product)).map((item) => item.size)
    if (sizes.length > 0) return sizes
  }

  const custom = (product.sizes ?? []).filter((size) => !APPAREL.includes(size))
  return [...APPAREL, ...custom]
}

/** True when there is nothing to choose, so the piece can be added directly. */
export const isOneSize = (product: Product) => product.sizes.length === 1

/**
 * Size chips. Sizes the piece is not made in, or that are out of stock for the
 * selected color, stay visible but disabled so the range reads consistently.
 */
export function SizePicker({
  product,
  color,
  onPick,
  className,
}: {
  product: Product
  /** Selected colorway; stock and size availability follow it. */
  color?: string
  onPick: (size: Size) => void
  className?: string
}) {
  const activeColor = color ?? defaultColor(product)
  const tracked = isStockTracked(product)

  return (
    <div
      className={cn("size-picker", className)}
      role="group"
      aria-label={t("Select a size for {name}", { name: product.name })}
    >
      {sizesToShow(product, activeColor).map((size) => {
        const made = product.sizes.includes(size)
        const stock = tracked ? stockFor(product, activeColor, size) : Infinity
        const available = made && stock > 0 && product.status !== "soldout"
        const outOfStock = made && stock <= 0

        return (
          <button
            key={size}
            type="button"
            className="size-chip"
            disabled={!available}
            onClick={() => onPick(size)}
            title={outOfStock ? t("Out of stock") : undefined}
            aria-label={
              available
                ? t("Size {size}", { size })
                : outOfStock
                  ? t("Size {size}, out of stock", { size })
                  : t("Size {size}, unavailable", { size })
            }
          >
            {tr(size)}
          </button>
        )
      })}
    </div>
  )
}
