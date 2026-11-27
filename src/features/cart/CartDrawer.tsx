import { useRef } from "react"
import { lineKey, useCart } from "@/features/cart/CartContext"
import { cn } from "@/shared/utils/cn"
import { formatPrice } from "@/shared/utils/format"
import { useDialog } from "@/shared/utils/useDialog"
import { OrderNote } from "@/features/cart/OrderNote"
import { SpendProgress } from "@/features/cart/SpendProgress"
import { QtyStepper } from "@/features/cart/QtyStepper"
import { Recommended } from "@/features/cart/Recommended"
import { EmptyBag } from "@/features/cart/EmptyBag"
import { Icon } from "@/shared/components/Icon"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

export function CartDrawer() {
  const {
    lines,
    count,
    subtotal,
    isOpen,
    setQty,
    remove,
    removing,
    closeCart,
  } = useCart()
  const panel = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useDialog({
    open: isOpen,
    onClose: closeCart,
    containerRef: panel,
    initialFocusRef: closeButton,
  })

  return (
    <div className={cn("cart-root", isOpen && "is-open")}>
      <div className="cart-scrim" onClick={closeCart} aria-hidden="true" />

      <aside
        ref={panel}
        id="cart-drawer"
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
      >
        <header className="cart-head">
          <h2 id="cart-title">
            {t("Your bag")} <span>({count})</span>
          </h2>
          <button
            ref={closeButton}
            type="button"
            className="nav-icon"
            aria-label={t("Close bag")}
            onClick={closeCart}
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="cart-shipping">
          <SpendProgress />
        </div>

        {lines.length === 0 ? (
          <EmptyBag variant="drawer" onNavigate={closeCart} />
        ) : (
          <div className="cart-scroll">
            <ul className="cart-lines">
              {lines.map(({ product, size, color, qty }) => (
                <li
                  key={lineKey(product.id, size, color)}
                  className={cn(
                    "cart-line",
                    removing.includes(lineKey(product.id, size, color)) && "is-removing",
                  )}
                >
                  <StoreImage className="photo" src={product.image} alt="" width={96} height={120} />
                  <div className="cart-line-body">
                    <div className="cart-line-top">
                      <div>
                        <h3>{tr(product.name)}</h3>
                        <p className="label">
                          {tr(color)}
                          <span className="line-size">{t("Size")} {tr(size)}</span>
                        </p>
                      </div>
                      <p className="cart-line-price">
                        {formatPrice(product.price * qty)}
                      </p>
                    </div>
                    <div className="cart-line-actions">
                      <QtyStepper
                        name={product.name}
                        qty={qty}
                        onChange={(next) => setQty(product.id, size, color, next)}
                      />
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => remove(product.id, size, color)}
                        aria-label={t("Remove {name}, size {size}, color {color}, from bag", { name: product.name, size: size, color: color })}
                      >
                        {t("Remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <OrderNote id="drawer-note" collapsible />

            <Recommended variant="drawer" limit={3} />
          </div>
        )}

        {lines.length > 0 && (
          <footer className="cart-foot">
            <div className="cart-subtotal">
              <span>{t("Subtotal")}</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p className="label">{t("Delivery fee calculated from your wilaya. Pay cash on delivery.")}</p>
            <a
              className="btn btn-solid cart-checkout"
              href="#/checkout"
              onClick={closeCart}
            >
              <span className="cart-checkout-label">
                <Icon name="lock" /> {t("Checkout")}
              </span>
              <Icon name="arrow" />
            </a>
            <div className="cart-foot-links">
              <a className="cart-continue" href="#/cart" onClick={closeCart}>
                {t("View full bag")}
              </a>
              <button
                type="button"
                className="cart-continue"
                onClick={closeCart}
              >
                {t("Continue shopping")}
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  )
}
