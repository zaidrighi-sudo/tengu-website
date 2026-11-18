import { useWishlist } from "@/store/context/WishlistContext"
import type { Product } from "@/store/data/products"
import { cn } from "@/store/utils/cn"
import { Icon } from "./Icon"
import { t } from "@/store/i18n"

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
