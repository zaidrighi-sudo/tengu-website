"use client"

import { useState } from "react"
import { useWishlist } from "@/features/wishlist/WishlistContext"
import type { Product } from "@/features/products/products"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t } from "@/shared/i18n"

/** Heart toggle for a product card. Works for guests. */
export function WishlistButton({ product }: { product: Product }) {
  const { has, toggle } = useWishlist()
  const saved = has(product.id)
  // Bumped on every toggle: the keyed icon remounts so the pop replays, which
  // also covers keyboard activation (where :active never fires).
  const [beat, setBeat] = useState(0)
  return (
    <button
      type="button"
      className={cn("wish-btn", saved && "is-on", beat > 0 && "is-beating")}
      aria-pressed={saved}
      aria-label={t("Save {name} to wishlist", { name: product.name })}
      onClick={() => {
        toggle(product.id)
        setBeat((count) => count + 1)
      }}
    >
      <Icon key={beat} name="heart" />
    </button>
  )
}
