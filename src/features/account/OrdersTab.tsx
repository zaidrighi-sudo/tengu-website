import { useEffect, useMemo, useState } from "react"
import { useCart } from "@/features/cart/CartContext"
import type { User } from "@/features/auth/AuthContext"
import { getMyOrders } from "@/features/orders/backend"
import { products } from "@/features/products/products"
import { wilayaDisplay } from "@/features/delivery/algeria"
import { loadOrders, removeSampleOrders } from "@/features/checkout/utils"
import type { Order } from "@/features/checkout/utils"
import { imagesForColor } from "@/features/products/variants"
import { cn } from "@/shared/utils/cn"
import { formatMoney } from "@/shared/utils/format"
import { trackingFor } from "@/features/account/tracking"
import { Icon } from "@/shared/components/Icon"
import { OrderTimeline } from "@/features/account/OrderTimeline"
import { t, tr, dateFormatter } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

const placedFmt = dateFormatter({ dateStyle: "medium" })

export function OrdersTab({ user, onChange }: { user: User; onChange: () => void }) {
  const [version, setVersion] = useState(0)
  const [serverOrders, setServerOrders] = useState<Order[]>([])
  const [serverState, setServerState] = useState<"loading" | "ready" | "error">(
    "loading",
  )

  // Orders placed from any device live in the database; pull them in and
  // merge with this device's copies (same order number = one card).
  useEffect(() => {
    let cancelled = false
    setServerState("loading")
    getMyOrders()
      .then((result) => {
        if (cancelled) return
        if (result.ok) {
          setServerOrders(
            result.orders.map((order) => ({
              ...order,
              lines: order.lines.map((line) => {
                const product = products.find((candidate) => candidate.id === line.id)
                const image = product
                  ? imagesForColor(product, line.color)[0]?.url || product.image
                  : ""
                return { ...line, image }
              }),
            })),
          )
          setServerState("ready")
        } else {
          setServerState("error")
        }
      })
      .catch(() => {
        if (!cancelled) setServerState("error")
      })
    return () => {
      cancelled = true
    }
  }, [user.email])

  const orders = useMemo(() => {
    const local = loadOrders().filter(
      (order) => order.email.toLowerCase() === user.email,
    )
    const byNumber = new Map<string, Order>()
    for (const order of serverOrders) byNumber.set(order.number, order)
    for (const order of local) if (!byNumber.has(order.number)) byNumber.set(order.number, order)
    return [...byNumber.values()].sort(
      (a, b) => +new Date(b.placedAt) - +new Date(a.placedAt),
    )
    // `version` forces a re-read after sample orders change.
  }, [user.email, serverOrders, version])
  const [open, setOpen] = useState<string | null>(null)
  const hasSamples = orders.some((order) => order.sample)

  // Keep an order expanded: the first one once the merged list is ready.
  useEffect(() => {
    setOpen((current) => current ?? orders[0]?.number ?? null)
  }, [orders])

  if (orders.length === 0) {
    if (serverState === "loading") {
      return (
        <div className="acct-empty" aria-busy="true">
          <Icon name="box" />
          <h2>{t("Loading orders")}</h2>
        </div>
      )
    }
    return (
      <div className="acct-empty">
        <Icon name="box" />
        <h2>{t("No orders yet")}</h2>
        <p>{t("When you place an order it shows up here, with live tracking from the studio to your door.")}</p>
        <div className="acct-empty-actions">
          <a className="btn btn-solid" href="#/shop">
            {t("Shop the drop")} <Icon name="arrow" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="acct-orders">
      <ul className="order-list">
        {orders.map((order) => (
          <OrderCard
            key={order.number}
            order={order}
            open={open === order.number}
            onToggle={() => setOpen(open === order.number ? null : order.number)}
          />
        ))}
      </ul>
        {serverState === "error" && (
          <p className="acct-note" role="status">
            {t("We could not refresh your orders from the server. Showing orders placed on this device.")}
          </p>
        )}
      {hasSamples && (
        <p className="acct-note">
          {t("Sample orders are for demonstration only.")}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              removeSampleOrders(user.email)
              setOpen(null)
              setVersion((v) => v + 1)
              onChange()
            }}
          >
            {t("Remove sample orders")}
          </button>
        </p>
      )}
    </div>
  )
}

function OrderCard({ order, open, onToggle }: { order: Order; open: boolean; onToggle: () => void }) {
  const { add } = useCart()
  const { current, delivered } = trackingFor(order)
  const panelId = `order-${order.number}`
  const count = order.lines.reduce((total, line) => total + line.qty, 0)

  const buyAgain = () => {
    for (const line of order.lines) {
      const product = products.find((p) => p.id === line.id)
      if (!product) continue
      // Orders from before sizes were chosen fall back to the first size in stock.
      const size =
        product.sizes.find((candidate) => candidate === line.size) ?? product.sizes[0]
      const color =
        product.colors.find((candidate) => candidate === line.color) ?? product.colors[0]
      for (let i = 0; i < line.qty; i++) add(product, size, color)
    }
  }

  return (
    <li className={cn("order-card", open && "is-open")}>
      <div className="order-card-head">
        <div className="order-card-id">
          <h3>
            {t("Order")} {order.number}
            {order.sample && <span className="tag order-sample">{t("Sample")}</span>}
          </h3>
          <p className="label">
            {t("Placed")} {placedFmt.format(new Date(order.placedAt))} · {count} {count === 1 ? t("item") : t("items")}
          </p>
        </div>
        <p className={cn("status-chip", delivered ? "is-delivered" : "is-live")}>
          <span aria-hidden="true" />
          {tr(current.label)}
        </p>
        <p className="order-card-total">{formatMoney(order.total)}</p>
        <ul className="order-thumbs" aria-label={t("Items")}>
          {order.lines.slice(0, 4).map((line) => (
            <li key={line.id}>
              <StoreImage className="photo" src={line.image} alt={tr(line.name)} width={48} height={60} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn order-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {open ? t("Hide details") : delivered ? t("View details") : t("Track order")}
          <Icon name="chevron" />
        </button>
      </div>

      <div id={panelId} className="order-detail" hidden={!open}>
        <OrderTimeline order={order} />
        <div className="order-detail-grid">
          <div>
            <h4 className="acct-h">{t("Items")}</h4>
            <ul className="co-items">
              {order.lines.map((line) => (
                <li key={line.id}>
                  <div className="co-item-media">
                    <StoreImage className="photo" src={line.image} alt="" width={64} height={80} />
                    <span className="co-item-qty" aria-hidden="true">{line.qty}</span>
                  </div>
                  <div className="co-item-text">
                    <p>{tr(line.name)}</p>
                    <p className="label">
                      {tr(line.color)}
                      {line.size && <span className="line-size">{t("Size")} {tr(line.size)}</span>}
                      <span className="sr-only">{t(", quantity")} {line.qty}</span>
                    </p>
                  </div>
                  <p className="co-item-price">{formatMoney(line.price * line.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="summary-rows">
              <div><dt>{t("Subtotal")}</dt><dd>{formatMoney(order.subtotal)}</dd></div>
              <div><dt>{t("Delivery ({method})", { method: tr(order.methodLabel) })}</dt><dd>{order.shipping === 0 ? t("Free") : formatMoney(order.shipping)}</dd></div>
              <div className="summary-total"><dt>{t("Total")}</dt><dd>{formatMoney(order.total)}</dd></div>
            </dl>
          </div>
          <div>
            <h4 className="acct-h">{t("Delivering to")}</h4>
            <address className="acct-address">
              {tr(order.address.firstName)} {tr(order.address.lastName)}
              <br />
              {tr(order.address.address1)}
              {order.address.address2 && <>, {tr(order.address.address2)}</>}
              <br />
              {tr(order.address.city)}, {wilayaDisplay(order.address.region)}
              <br />
              {tr(order.address.phone)}
            </address>
            <h4 className="acct-h">{t("Payment")}</h4>
            <p className="acct-address">{t("Cash on delivery")}</p>
            <div className="order-detail-actions">
              <button type="button" className="btn btn-solid" onClick={buyAgain}>
                {t("Buy again")} <Icon name="arrow" />
              </button>
              <a className="co-link co-link-fwd" href="#/contact">
                <Icon name="arrow" /> {t("Need help with this order?")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
