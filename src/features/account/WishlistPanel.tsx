import { ProductCard } from "@/features/products/ProductCard"
import { Icon } from "@/shared/components/Icon"
import { useCallback } from "react"
import { useCart } from "@/features/cart/CartContext"
import { useWishlist } from "@/features/wishlist/WishlistContext"
import { products } from "@/features/products/products"
import { t } from "@/shared/i18n"

/** Saved pieces grid. Shared by the account tab and the public wishlist page. */
export function WishlistPanel() {
  const { ids, clear } = useWishlist()
  const { add } = useCart()
  const saved = ids.flatMap((id) => products.find((p) => p.id === id) ?? [])

  const addAndOpenCart = useCallback((product: any, size: any, color: any) => {
    add(product, size, color, { openCart: true })
  }, [add])

  if (saved.length === 0)
    return (
      <div className="acct-empty">
        <Icon name="heart" />
        <h2>{t("Nothing saved yet")}</h2>
        <p>{t("Tap the heart on any piece to keep it here. Saved pieces stay on this device.")}</p>
        <div className="acct-empty-actions">
          <a className="btn btn-solid" href="#/shop">
            {t("Browse the drop")} <Icon name="arrow" />
          </a>
        </div>
      </div>
    )

  return (
    <div>
      <div className="wish-bar">
        <p aria-live="polite">
          {t("{count} saved {unit}", {
            count: saved.length,
            unit: saved.length === 1 ? t("piece") : t("pieces"),
          })}
        </p>
        <div className="wish-bar-actions">
          <button type="button" className="link-btn" onClick={clear}>
            {t("Clear all")}
          </button>
        </div>
      </div>
      <ul className="wish-grid">
        {saved.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} onAdd={(size, color) => addAndOpenCart(product, size, color)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
