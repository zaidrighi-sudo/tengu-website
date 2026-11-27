import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react"
import { type Product, type Size, type ColorName, isNewIn } from "@/features/products/products"
import { cn } from "@/shared/utils/cn"
import { formatPrice } from "@/shared/utils/format"
import { SizeGuide } from "@/features/products/SizeGuide"
import { isOneSize } from "@/features/products/SizePicker"
import { WishlistButton } from "@/features/wishlist/WishlistButton"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"
import {
  colorHexFor,
  colorsForProduct,
  defaultColor,
  hasStock,
  imagesForColor,
  sizesForColor,
} from "@/features/products/variants"

export function ProductCard({
  product,
  onAdd,
  index = 0,
}: {
  product: Product
  onAdd: (size: Size, color: ColorName) => void
  /** Position in a grid, used to stagger the entrance. */
  index?: number
}) {
  const [picking, setPicking] = useState(false)
  const [selectedColor, setSelectedColor] = useState<ColorName>(() => defaultColor(product))
  const quickAdd = useRef<HTMLButtonElement>(null)

  const colors = useMemo(() => colorsForProduct(product), [product])

  // The gallery follows the selected color: first image is the cover, the
  // second crossfades in on hover.
  const gallery = useMemo(
    () => imagesForColor(product, selectedColor),
    [product, selectedColor],
  )
  const mainImage = gallery[0]?.url || product.image
  const hoverImage = gallery[1]?.url || product.hoverImage || mainImage

  const soldOut = product.status === "soldout" || !hasStock(product)
  const colorOut = !sizesForColor(product, selectedColor).some((size) => size.available)
  const unavailable = soldOut || colorOut
  // Real route for this piece — internal link for SEO; no hash routing.
  const href = product.slug ? `/product/${encodeURIComponent(product.slug)}` : null

  const discount = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : 0

  // A color picked elsewhere (for example in the size panel) should stick.
  useEffect(() => {
    if (colors.length === 0) return
    if (!colors.includes(selectedColor)) setSelectedColor(colors[0])
  }, [colors, selectedColor])

  // Escape closes the size panel and hands focus back to the button.
  useEffect(() => {
    if (!picking) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setPicking(false)
      quickAdd.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [picking])

  const choose = (size: Size, color: ColorName) => {
    setSelectedColor(color)
    setPicking(false)
    onAdd(size, color)
  }

  return (
    <article
      className={cn("product-card", unavailable && "is-soldout", picking && "is-picking")}
      style={{ "--i": index } as CSSProperties}
      data-pid={product.id}
      tabIndex={-1}
    >
      <div className="product-media">
        {href ? (
          <a className="product-media-link" href={href} aria-label={tr(product.name)}>
            <StoreImage
              className="photo product-img"
              src={mainImage}
              alt={`${product.name} in ${selectedColor.toLowerCase()}`}
            />
            {/* Second photo of the colorway crossfades in on hover or focus. */}
            <StoreImage className="photo product-img product-img-alt" src={hoverImage} alt="" />
          </a>
        ) : (
          <>
            <StoreImage
              className="photo product-img"
              src={mainImage}
              alt={`${product.name} in ${selectedColor.toLowerCase()}`}
            />
            <StoreImage className="photo product-img product-img-alt" src={hoverImage} alt="" />
          </>
        )}

        <div className="product-flags">
          {product.status !== "sale" && isNewIn(product) && (
            <span className="tag">{t("New")}</span>
          )}
          {product.status === "sale" && (
            <span className="tag tag-sale">{t("Sale −{discount}%", { discount })}</span>
          )}
          {unavailable && <span className="tag tag-out">{t("Sold out")}</span>}
        </div>

        <WishlistButton product={product} />

        {picking && (
          <div className="size-panel">
            <div className="size-panel-head">
              <span>{t("Select size")}</span>
              <button
                type="button"
                className="size-panel-close"
                onClick={() => {
                  setPicking(false)
                  quickAdd.current?.focus()
                }}
                aria-label={t("Close size selection")}
              >
                ×
              </button>
            </div>
            <SizeGuide
              product={product}
              color={selectedColor}
              onColorChange={setSelectedColor}
              onPick={choose}
            />
          </div>
        )}

        <button
          ref={quickAdd}
          type="button"
          className="quick-add"
          disabled={unavailable}
          aria-expanded={picking}
          onClick={() =>
            isOneSize(product)
              ? onAdd(product.sizes[0], selectedColor)
              : setPicking((open) => !open)
          }
          aria-label={
            unavailable
              ? t("{name} is sold out", { name: product.name })
              : t("Choose a size and add {name} to bag", { name: product.name })
          }
        >
          <span>
            {unavailable
              ? t("Sold out")
              : isOneSize(product)
                ? t("Quick add")
                : t("Choose size")}
          </span>
          <span aria-hidden="true">{unavailable ? "" : "+"}</span>
        </button>
      </div>

      <div className="product-info">
        <div className="product-row">
          <h3>
            {href ? (
              <a className="product-name-link" href={href}>
                {tr(product.name)}
              </a>
            ) : (
              tr(product.name)
            )}
          </h3>
          <p className="product-price">
            <span className={cn(product.status === "sale" && "is-sale")}>
              {formatPrice(product.price)}
            </span>
            {product.compareAt && (
              <s>
                <span className="sr-only">{t("Was")} </span>
                {formatPrice(product.compareAt)}
              </s>
            )}
          </p>
        </div>
        <div className="product-meta">
          <ul className="swatches" aria-label={t("Available colors")}>
            {colors.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="swatch swatch-button"
                  style={{ "--swatch": colorHexFor(product, name) } as CSSProperties}
                  aria-pressed={selectedColor === name}
                  aria-label={tr(name)}
                  title={tr(name)}
                  onClick={() => setSelectedColor(name)}
                />
              </li>
            ))}
          </ul>
          <span className="label">
            {colors.length === 1 ? tr(colors[0]) : `${colors.length} colors`}
          </span>
        </div>
      </div>
    </article>
  )
}

/** Loading placeholder with the same footprint as a real card. */
export function ProductCardSkeleton() {
  return (
    <div className="product-card is-skeleton" aria-hidden="true">
      <div className="product-media skeleton" />
      <div className="product-info">
        <span className="skeleton skeleton-line" style={{ width: "70%" }} />
        <span className="skeleton skeleton-line" style={{ width: "35%" }} />
      </div>
    </div>
  )
}
