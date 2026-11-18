import Link from "next/link"
import { redirect } from "next/navigation"
import { updateOrder, type LeanOrder } from "@/lib/admin/actions"
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/admin/helpers"

/**
 * The editable order form, split out of the edit page so it can be rendered
 * with a mock order on a preview route. Server component; submits to the
 * admin `updateOrder` action and returns to the orders list.
 */
export async function OrderEditForm({ order }: { order: LeanOrder }) {
  async function handleSubmit(formData: FormData) {
    "use server"
    await updateOrder(String(order._id), {
      status: formData.get("status") as string,
      internalNotes: formData.get("internalNotes") as string,
      "customer.firstName": formData.get("customerFirstName") as string,
      "customer.lastName": formData.get("customerLastName") as string,
      "customer.phone": formData.get("customerPhone") as string,
      "address.wilaya": formData.get("addressWilaya") as string,
      "address.commune": formData.get("addressCommune") as string,
      "address.street": formData.get("addressStreet") as string,
      "address.landmark": formData.get("addressLandmark") as string,
      deliveryMethod: formData.get("deliveryMethod") as string,
    })
    redirect("/manage/orders")
  }

  const statuses = ["new", "confirmed", "shipped", "delivered", "cancelled", "returned"]

  return (
    <form action={handleSubmit} className="admin-form" noValidate>
      {/* Order Info */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Order Information</h2>

        <div className="admin-field-row">
          <div className="admin-field">
            <label className="admin-field-label">Order Number</label>
            <input type="text" value={order.number as string} className="admin-field-input" readOnly style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="admin-field">
            <label className="admin-field-label">Date Placed</label>
            <input type="text" value={formatDate(order.createdAt)} className="admin-field-input" readOnly />
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label className="admin-field-label">Grand Total</label>
            <input type="text" value={formatCurrency(order.total as number)} className="admin-field-input" readOnly style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }} />
          </div>
          <div className="admin-field">
            <label htmlFor="status" className="admin-field-label">Fulfillment Status *</label>
            <select id="status" name="status" defaultValue={order.status as string} required className="admin-field-select">
              {statuses.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s).toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Items Ordered (read-only) */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Items Ordered</h2>
        {Array.isArray(order.lines) && order.lines.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>COLOR</th>
                  <th>SIZE</th>
                  <th style={{ textAlign: "center" }}>QTY</th>
                  <th style={{ textAlign: "right" }}>UNIT</th>
                  <th style={{ textAlign: "right" }}>LINE TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{line.name}</div>
                    </td>
                    <td>{line.color ?? "—"}</td>
                    <td>{line.size}</td>
                    <td style={{ textAlign: "center" }}>{line.qty}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatCurrency(line.unitPrice * line.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--admin-muted)", fontSize: "0.8125rem" }}>No line items recorded.</p>
        )}
      </section>

      {/* Order Totals (read-only) */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Order Totals</h2>

        <div className="admin-field-row">
          <div className="admin-field">
            <label className="admin-field-label">Subtotal</label>
            <input type="text" value={formatCurrency(order.subtotal ?? 0)} className="admin-field-input" readOnly style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="admin-field">
            <label className="admin-field-label">Delivery Fee{order.deliveryMethod === "desk" ? " (Stop-Desk)" : " (Home)"}</label>
            <input type="text" value={formatCurrency(order.shippingFee ?? 0)} className="admin-field-input" readOnly style={{ fontFamily: "var(--font-mono)" }} />
          </div>
          <div className="admin-field">
            <label className="admin-field-label">Delivery Estimate</label>
            <input type="text" value={order.deliveryDays ? `${order.deliveryDays} days` : "—"} className="admin-field-input" readOnly />
          </div>
        </div>

        {order.loyaltyFreeDelivery && (
          <div className="admin-field">
            <label className="admin-field-label">Loyalty Reward</label>
            <input
              type="text"
              value="YES — free home delivery (lifetime spend reward)"
              className="admin-field-input"
              readOnly
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
        )}

      </section>

      {/* Customer Info */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Customer Details</h2>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="customerFirstName" className="admin-field-label">First Name</label>
            <input id="customerFirstName" name="customerFirstName" type="text" defaultValue={order.customer.firstName ?? ""} className="admin-field-input" />
          </div>
          <div className="admin-field">
            <label htmlFor="customerLastName" className="admin-field-label">Last Name</label>
            <input id="customerLastName" name="customerLastName" type="text" defaultValue={order.customer.lastName ?? ""} className="admin-field-input" />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="customerPhone" className="admin-field-label">Contact Phone</label>
          <input id="customerPhone" name="customerPhone" type="tel" defaultValue={order.customer.phone ?? ""} className="admin-field-input" />
        </div>
      </section>

      {/* Delivery Address */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Delivery Address</h2>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="addressWilaya" className="admin-field-label">Wilaya</label>
            <input id="addressWilaya" name="addressWilaya" type="text" defaultValue={order.address.wilaya ?? ""} className="admin-field-input" />
          </div>
          <div className="admin-field">
            <label htmlFor="addressCommune" className="admin-field-label">Commune</label>
            <input id="addressCommune" name="addressCommune" type="text" defaultValue={order.address.commune ?? ""} className="admin-field-input" />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="addressStreet" className="admin-field-label">Street Address</label>
          <input id="addressStreet" name="addressStreet" type="text" defaultValue={order.address.street ?? ""} className="admin-field-input" />
        </div>

        <div className="admin-field">
          <label htmlFor="addressLandmark" className="admin-field-label">Landmark / Directions (Optional)</label>
          <input id="addressLandmark" name="addressLandmark" type="text" defaultValue={order.address.landmark ?? ""} className="admin-field-input" placeholder="Nearby landmark for courier" />
        </div>

        <div className="admin-field">
          <label htmlFor="deliveryMethod" className="admin-field-label">Delivery Channel</label>
          <select id="deliveryMethod" name="deliveryMethod" defaultValue={order.deliveryMethod as string} className="admin-field-select">
            <option value="home">Home Courier Delivery</option>
            <option value="desk">Stop-Desk Pickup</option>
          </select>
        </div>

        <div className="admin-field">
          <label className="admin-field-label">Customer Note (from checkout)</label>
          <textarea className="admin-field-textarea" rows={2} readOnly value={order.note || "—"} placeholder="No note from the customer." />
        </div>
      </section>

      {/* Internal Notes */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Internal Staff Notes</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", marginBottom: "var(--space-3)", lineHeight: 1.5 }}>
          Private to administrative staff: courier tracking number, call verification, dispatch logs.
        </p>
        <div className="admin-field">
          <textarea
            id="internalNotes"
            name="internalNotes"
            className="admin-field-textarea"
            rows={4}
            defaultValue={String(order.internalNotes || "")}
            placeholder="Courier tracking reference, verification call notes..."
          />
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Link href="/manage/orders" className="admin-btn admin-btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="admin-btn admin-btn-primary">
          Update Order
        </button>
      </div>
    </form>
  )
}
