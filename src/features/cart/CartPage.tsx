import { useRef, useState } from "react"
import { OrderNote } from "@/features/cart/OrderNote"
import { QtyStepper } from "@/features/cart/QtyStepper"
import { Recommended } from "@/features/cart/Recommended"
import { ShippingProgress } from "@/features/cart/ShippingProgress"
import { EmptyBag } from "@/features/cart/EmptyBag"
import { Icon } from "@/shared/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { TrustBadges } from "@/features/shell/TrustBadges"
import { lineKey, lineLimit, useCart } from "@/features/cart/CartContext"
import type { Product, Size, ColorName } from "@/features/products/products"
import { imagesForColor } from "@/features/products/variants"
import { formatPrice } from "@/shared/utils/format"
import { cn } from "@/shared/utils/cn"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

export default function Cart() {
  const { lines, count, subtotal, setQty, remove, removing } = useCart()
  const heading = useRef<HTMLHeadingElement>(null)
  const [message, setMessage] = useState("")

  const removeLine = (product: Product, size: Size, color: ColorName) => {
    remove(product.id, size, color)
    setMessage(t("{name}, size {size}, color {color}, removed from bag.", { name: product.name, size, color }))
    // The Remove button is about to disappear: keep focus on the page.
    heading.current?.focus()
  }

  return (
    <Layout overlayHeader={false}>
      <div className="cart-page">
        <header className="shop-head">
          <nav aria-label={t("Breadcrumb")}>
            <ol className="crumbs">
              <li>
                <a href="#/">{t("Home")}</a>
              </li>
              <li aria-current="page">{t("Bag")}</li>
            </ol>
          </nav>
          <h1 ref={heading} tabIndex={-1} className="shop-title">
            {t("Your bag")}
            {count > 0 && <span className="cart-page-count">{count}</span>}
          </h1>
        </header>
        <p className="sr-only" role="status">
          {tr(message)}
        </p>

        {lines.length === 0 ? (
          <EmptyBag variant="page" />
        ) : (
          <div className="cart-page-grid">
            <section aria-label={t("Items in your bag")} className="cart-page-main">
              <ul className="cart-page-lines">
                {lines.map(({ product, size, color, qty }) => {
                  const image = imagesForColor(product, color)[0]?.url || product.image
                  return (
                    <li
                      key={lineKey(product.id, size, color)}
                      className={cn(
                        "cart-page-line",
                        removing.includes(lineKey(product.id, size, color)) && "is-removing",
                      )}
                    >
                      <StoreImage className="photo" src={image} alt="" width={140} height={175} />
                      <div className="cart-page-info">
                        <h2>{tr(product.name)}</h2>
                        <p className="label">
                          {tr(color)}
                          <span className="line-size">{t("Size")} {tr(size)}</span>
                        </p>
                        <p className="cart-page-unit">
                          {formatPrice(product.price)}
                          {product.compareAt && (
                            <s>{formatPrice(product.compareAt)}</s>
                          )}
                        </p>
                      </div>
                      <div className="cart-page-qty">
                        <QtyStepper
                          name={product.name}
                          qty={qty}
                          max={lineLimit(product, size, color)}
                          onChange={(next) => setQty(product.id, size, color, next)}
                        />
                        <button
                          type="button"
                          className="cart-remove"
                          onClick={() => removeLine(product, size, color)}
                          aria-label={t("Remove {name}, size {size}, color {color}, from bag", { name: product.name, size: size, color: color })}
                        >
                          {t("Remove")}
                        </button>
                      </div>
                      <p className="cart-page-total">
                        {formatPrice(product.price * qty)}
                      </p>
                    </li>
                  )
                })}
              </ul>
              <OrderNote id="page-note" />
            </section>

            <aside className="cart-summary" aria-labelledby="summary-title">
              <h2 id="summary-title">{t("Order summary")}</h2>
              <ShippingProgress subtotal={subtotal} />
              <dl className="summary-rows">
                <div>
                  <dt>{t("Subtotal")}</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div>
                  <dt>{t("Shipping")}</dt>
                  <dd className="summary-muted">{t("Calculated at checkout")}</dd>
                </div>
              </dl>
              <a className="btn btn-solid btn-lg cart-page-checkout" href="#/checkout">
                <span className="cart-checkout-label">
                  <Icon name="lock" /> {t("Checkout")}
                </span>
                <Icon name="arrow" />
              </a>
              <a className="cart-continue" href="#/shop">
                {t("Continue shopping")}
              </a>
              <TrustBadges />
            </aside>
          </div>
        )}

        <Recommended
          variant="page"
          limit={4}
          heading={lines.length === 0 ? t("Start with these") : undefined}
        />
      </div>
    </Layout>
  )
}
