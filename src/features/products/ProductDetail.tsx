"use client"

import { type CSSProperties, useMemo, useRef, useState } from "react"
import { CartProvider, useCart } from "@/features/cart/CartContext"
import { type StoreData, hydrateStore } from "@/features/site-settings/data"
import { type Product, type Size, isNewIn } from "@/features/products/products"
import { cn } from "@/shared/utils/cn"
import { formatPrice } from "@/shared/utils/format"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"
import {
  colorHexFor,
  colorsForProduct,
  defaultColor,
  hasStock,
  imagesForColor,
  isOneSizeProduct,
  sizesForColor,
} from "@/features/products/variants"
import { SizeGuide } from "@/features/products/SizeGuide"

type ProductDetailProps = {
  product: Product
  data: StoreData
}

/**
 * Product detail island rendered inside the real /product/<slug> route.
 * It SSRs like any other client component: the static markup (name, price,
 * gallery, sizes) is in the HTML for crawlers; interactivity (color/size
 * picking, add to bag) hydrates on the client.
 *
 * Hydrates the shared storefront data synchronously during the first render
 * so the cart and variant helpers resolve the exact same product objects as
 * the hash-routed app (same pattern as StoreApp).
 */
export default function ProductDetail({ product, data }: ProductDetailProps) {
  const hydrated = useRef(false)
  if (!hydrated.current) {
    hydrated.current = true
    hydrateStore(data)
  }
  return (
    <CartProvider>
      <Detail product={product} />
    </CartProvider>
  )
}

function Detail({ product }: { product: Product }) {
  const { add } = useCart()
  const colors = useMemo(() => colorsForProduct(product), [product])
  const oneSize = isOneSizeProduct(product)
  const [color, setColor] = useState(() => defaultColor(product))
  const [size, setSize] = useState<Size | null>(
    () => (oneSize ? (product.sizes[0] ?? null) : null),
  )
  const [photo, setPhoto] = useState(0)

  const gallery = useMemo(() => imagesForColor(product, color), [product, color])
  const activePhoto = Math.min(photo, Math.max(0, gallery.length - 1))
  const hero = gallery[activePhoto] ?? { url: product.image, color }

  const sizeStock = useMemo(() => sizesForColor(product, color), [product, color])
  const lineSoldOut = product.status === "soldout" || !hasStock(product)
  const colorSoldOut = sizeStock.length > 0 && sizeStock.every((entry) => !entry.available)
  const soldOut = lineSoldOut || colorSoldOut

  const sizeSelector = oneSize ? (
    <p className="pdp-fit">{t("Size")}: {product.sizes[0]}</p>
  ) : colors.length > 0 ? (
    <SizeGuide
      product={product}
      color={color}
      onColorChange={setColor}
      onPick={(nextSize, nextColor) => {
        setSize(nextSize)
        setColor(nextColor)
      }}
    />
  ) : null

  const discount =
    product.compareAt && product.compareAt > 0
      ? Math.max(1, Math.round((1 - product.price / product.compareAt) * 100))
      : 0

  const chooseColor = (name: string) => {
    setColor(name)
    setPhoto(0)
    // Keep the picked size only if it is still available in the new colorway.
    setSize((current) => {
      if (!current || oneSize) return oneSize ? product.sizes[0] ?? null : current
      const still = sizesForColor(product, name).find((entry) => entry.size === current)
      return still?.available ? current : null
    })
  }

  const canAdd = !soldOut && size !== null

  const onAdd = () => {
    if (!size) return
    add(product, size, color)
    window.location.assign("/#/cart")
  }

  return (
    <article className="pdp">
      <div className="pdp-gallery">
        <div className="pdp-hero">
          <StoreImage
            src={hero.url || product.image}
            alt={color ? `${product.name} in ${color}` : product.name}
            className="pdp-hero-img"
            width={900}
            height={1125}
            priority
          />
          <div className="pdp-flags">
            {product.status !== "sale" && isNewIn(product) && (
              <span className="tag">{t("New")}</span>
            )}
            {product.status === "sale" && (
              <span className="tag tag-sale">{t("Sale -{discount}%", { discount })}</span>
            )}
            {soldOut && <span className="tag tag-out">{t("Sold out")}</span>}
          </div>
        </div>
        {gallery.length > 1 && (
          <div className="pdp-thumbs" aria-label="Product photos">
            {gallery.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                aria-pressed={index === activePhoto}
                aria-label={`Photo ${index + 1}`}
                className={cn("pdp-thumb", index === activePhoto && "is-active")}
                onClick={() => setPhoto(index)}
              >
                <StoreImage src={image.url} alt="" width={160} height={200} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pdp-info">
        <p className="pdp-eyebrow">{tr(product.category)}</p>
        <h1 className="pdp-title">{tr(product.name)}</h1>

        <p className="pdp-price">
          <span className={cn("pdp-price-value", product.status === "sale" && "is-sale")}>
            {formatPrice(product.price)}
          </span>
          {product.compareAt ? (
            <s className="pdp-compare">
              <span className="sr-only">{t("Was")} </span>
              {formatPrice(product.compareAt)}
            </s>
          ) : null}
        </p>

        {product.fit && (
          <p className="pdp-fit">
            {t("Fit")}: {tr(product.fit)}
          </p>
        )}

        {colors.length > 0 && (
          <div className="pdp-option">
            <p className="pdp-option-label">
              {t("Color")} <span className="pdp-option-value">{tr(color)}</span>
            </p>
            <ul className="swatches pdp-swatches" aria-label={t("Available colors")}>
              {colors.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="swatch swatch-button"
                    style={{ "--swatch": colorHexFor(product, name) } as CSSProperties}
                    aria-pressed={name === color}
                    onClick={() => chooseColor(name)}
                    aria-label={tr(name)}
                    title={tr(name)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {sizeSelector}

        <button
          type="button"
          className="btn btn-solid btn-lg pdp-add"
          disabled={!canAdd}
          onClick={onAdd}
        >
          <span>{soldOut ? t("Sold out") : t("Add to bag")}</span>
          <span aria-hidden="true">→</span>
        </button>

        <p className="pdp-assurance">
          {t(
            "Cash on delivery. You pay the courier in cash when your parcel arrives, after you have opened it and checked it. No card or advance payment is needed.",
          )}
        </p>
        <a className="pdp-policy-link" href="/#/shipping-returns">
          {t("Shipping and returns")}
        </a>
      </div>
    </article>
  )
}
