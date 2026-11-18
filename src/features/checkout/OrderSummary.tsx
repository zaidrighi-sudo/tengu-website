import { useId, useState } from "react"
import { lineKey, useCart } from "@/features/cart/CartContext"
import { formatMoney } from "@/shared/utils/format"
import { imagesForColor } from "@/features/products/variants"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

/**
 * Order summary. A fixed sidebar on desktop; on small screens it collapses
 * behind a bar that always shows the total, so the price never leaves view.
 */
export function OrderSummary({
  totals,
  pending,
}: {
  totals: { shipping: number; total: number }
  /** True until a shipping method is confirmed: show "next step" for the rest. */
  pending: boolean
}) {
  const { lines, subtotal } = useCart()
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  const total = pending ? subtotal : totals.total

  return (
    <aside className={cn("co-summary", open && "is-open")} aria-label={t("Order summary")}>
      <button
        type="button"
        className="co-summary-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="co-summary-toggle-label">
          <Icon name="bag" />
          {open ? t("Hide order summary") : t("Show order summary")}
          <Icon name="chevron" />
        </span>
        <strong>{formatMoney(total)}</strong>
      </button>

      <div id={bodyId} className="co-summary-body">
        <ul className="co-items">
          {lines.map(({ product, size, color, qty }) => {
            const image = imagesForColor(product, color)[0]?.url || product.image
            return (
              <li key={lineKey(product.id, size, color)}>
                <div className="co-item-media">
                  <StoreImage className="photo" src={image} alt="" width={64} height={80} />
                  <span className="co-item-qty" aria-hidden="true">
                    {qty}
                  </span>
                </div>
                <div className="co-item-text">
                  <p>{tr(product.name)}</p>
                  <p className="label">
                    {tr(color)}
                    <span className="line-size">{t("Size")} {tr(size)}</span>
                    <span className="sr-only">{t(", quantity")} {qty}</span>
                  </p>
                </div>
                <p className="co-item-price">{formatMoney(product.price * qty)}</p>
              </li>
            )
          })}
        </ul>

        <dl className="summary-rows">
          <div>
            <dt>{t("Subtotal")}</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div>
            <dt>{t("Delivery")}</dt>
            <dd className={pending ? "summary-muted" : undefined}>
              {pending
                ? t("Calculated from your wilaya and commune")
                : totals.shipping === 0
                  ? t("Free")
                  : formatMoney(totals.shipping)}
            </dd>
          </div>
          <div className="summary-total">
            <dt>{t("Total")}</dt>
            <dd>
              {formatMoney(total)}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  )
}
