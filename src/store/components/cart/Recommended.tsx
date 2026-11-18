import { useMemo, useRef, useState } from "react"
import { useCart } from "@/store/context/CartContext"
import { FREE_SHIPPING_THRESHOLD } from "@/store/data/navigation"
import { cn } from "@/store/utils/cn"
import { formatPrice } from "@/store/utils/format"
import type { Product, Size, ColorName } from "@/store/data/products"
import { recommendAddOns } from "@/store/utils/recommend"
import { Icon } from "../Icon"
import { SizeGuide } from "../SizeGuide"
import { isOneSize } from "../SizePicker"
import { defaultColor, hasStock, imagesForColor } from "@/store/utils/variants"
import { t, tr } from "@/store/i18n"
import { StoreImage } from "@/store/components/StoreImage"

/**
 * Recommended add-ons. Adding one never opens the drawer: the shopper is
 * already looking at the bag.
 */
export function Recommended({
  variant,
  limit = 3,
  heading = "Complete the look",
}: {
  variant: "drawer" | "page"
  limit?: number
  heading?: string
}) {
  const { lines, subtotal, add } = useCart()
  const bagKey = lines.map((line) => line.product.id).join(",")
  const items = useMemo(
    () => recommendAddOns(lines.map((line) => line.product.id), limit),
    // Recompute only when the set of products in the bag changes.
    [bagKey, limit],
  )
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const title = useRef<HTMLHeadingElement>(null)
  const [announcement, setAnnouncement] = useState("")
  const [picking, setPicking] = useState<string | null>(null)

  // The added item leaves this list, so park focus on the heading instead of
  // letting it fall back to the page.
  const addItem = (product: Product, size: Size, color: ColorName) => {
    add(product, size, color, { openCart: false })
    setPicking(null)
    setAnnouncement(t("{name}, size {size}, color {color}, added to bag.", { name: product.name, size, color }))
    title.current?.focus()
  }

  if (items.length === 0) return null

  return (
    <section
      className={cn("addons", `addons-${variant}`)}
      aria-labelledby={`addons-title-${variant}`}
    >
      <div className="addons-head">
        <h2
          id={`addons-title-${variant}`}
          ref={title}
          tabIndex={-1}
          className="addons-title"
        >
          {tr(heading)}
        </h2>
        {remaining > 0 && lines.length > 0 && (
          <p className="label">
            {formatPrice(remaining)} {t("more for free shipping")}
          </p>
        )}
      </div>
      <ul className="addons-list">
        {items.map((product) => {
          const color = defaultColor(product)
          const image = imagesForColor(product, color)[0]?.url || product.image
          const soldOut = product.status === "soldout" || !hasStock(product)
          return (
            <li key={product.id} className="addon">
              <div className="addon-media">
                <StoreImage className="photo" src={image} alt="" width={160} height={200} />
              </div>
              <div className="addon-body">
                <h3>{tr(product.name)}</h3>
                <p className="label">{tr(color)}</p>
                <p className="addon-price">{formatPrice(product.price)}</p>
              </div>
              <button
                type="button"
                className="addon-add"
                aria-expanded={picking === product.id}
                disabled={soldOut}
                onClick={() =>
                  isOneSize(product)
                    ? addItem(product, product.sizes[0], color)
                    : setPicking(picking === product.id ? null : product.id)
                }
                aria-label={soldOut
                  ? t("{name} is sold out", { name: product.name })
                  : t("Choose a size and add {name} to bag, {v1}", { name: product.name, v1: formatPrice(product.price) })}
              >
                <Icon name="plus" />
                <span>{soldOut ? t("Sold out") : t("Add")}</span>
              </button>
              {picking === product.id && (
                <SizeGuide
                  className="addon-sizes"
                  product={product}
                  onPick={(size, pickedColor) => addItem(product, size, pickedColor)}
                />
              )}
            </li>
          )
        })}
      </ul>
      <p className="sr-only" role="status">
        {tr(announcement)}
      </p>
    </section>
  )
}
