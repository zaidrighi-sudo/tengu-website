import { useWishlist } from "@/features/wishlist/WishlistContext"
import type { Product } from "@/features/products/products"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t } from "@/shared/i18n"

/** Heart toggle for a product card. Works for guests. */
export function WishlistButton({ product }: { product: Product }) {
  const { has, toggle } = useWishlist()
  const saved = has(product.id)
  return (
    <button
      type="button"
      className={cn("wish-btn", saved && "is-on")}
      aria-pressed={saved}
      aria-label={t("Save {name} to wishlist", { name: product.name })}
      onClick={() => toggle(product.id)}
    >
      <Icon name="heart" />
    </button>
  )
}
