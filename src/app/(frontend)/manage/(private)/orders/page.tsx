import Link from "next/link"
import { getOrders, updateOrderStatus } from "@/lib/admin/actions/orders"
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/admin/helpers"
import "@/store/styles/global.css"
import "../admin.css"

async function updateOrderStatusAction(formData: FormData) {
  "use server"
  await updateOrderStatus(String(formData.get("id")), String(formData.get("status")))
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""
  const status = resolvedParams.status || ""

  const { docs: orders, totalDocs, totalPages } = await getOrders(page, 20, search, status)

  const statuses = [
    { value: "", label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">ORDERS</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 04 / ORDERS · 注文管理 ]</div>
            <h1 className="admin-page-title">ORDERS</h1>
            <p className="admin-page-subtitle">
              Manage incoming customer purchases, review delivery addresses, and update fulfillment progress.
            </p>
          </div>
          <span className="admin-filter-count">
            {totalDocs} TOTAL ORDERS
          </span>
        </div>
      </header>

      {/* Search & Filter Toolbar */}
      <form className="admin-toolbar" method="GET">
        <div className="admin-search">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="SEARCH ORDERS BY NUMBER, NAME, PHONE..."
            className="admin-search-input"
            aria-label="Search orders"
          />
        </div>
        <div className="admin-filters">
          <select name="status" className="admin-filter-select" defaultValue={status}>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label.toUpperCase()}
              </option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            FILTER
          </button>
          {(search || status) && (
            <Link href="/manage/orders" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Orders Table */}
      {orders.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER #</th>
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>DELIVERY METHOD</th>
                  <th style={{ textAlign: "right" }}>TOTAL</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                  <th style={{ textAlign: "right" }}>DATE</th>
                  <th style={{ width: "160px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{order.number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {order.customer?.firstName} {order.customer?.lastName}
                      </div>
                      {order.user && (
                        <div style={{ fontSize: "0.6875rem", color: "var(--admin-muted)" }}>
                          {order.user.email}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {order.customer?.phone || "—"}
                    </td>
                    <td>
                      <div>{order.deliveryMethod === "home" ? "Home Delivery" : "Pickup Desk"}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--admin-muted)" }}>
                        {order.address?.wilaya}, {order.address?.commune}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatCurrency(order.total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions">
                        <Link href={`/manage/orders/${order._id}/edit`} className="admin-action-btn" title="View / Edit Order">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        {/* Quick status change */}
                        {order.status !== "delivered" && order.status !== "cancelled" && order.status !== "returned" && (
                          <form
                            action={updateOrderStatusAction}
                            style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}
                          >
                            <input type="hidden" name="id" value={String(order._id)} />
                            <select name="status" className="admin-filter-select" style={{ padding: "0.35rem 0.5rem", fontSize: "0.6875rem" }}>
                              <option value="" disabled>Change</option>
                              {["confirmed", "shipped", "delivered", "returned", "cancelled"].map((s) =>
                                order.status !== s && <option key={s} value={s}>{getStatusLabel(s)}</option>
                              )}
                            </select>
                            <button type="submit" className="admin-btn admin-btn-sm admin-btn-secondary" style={{ minHeight: "1.75rem", padding: "0 0.5rem" }}>
                              OK
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Pagination">
              <Link
                href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`}
                className="admin-pagination-btn"
                aria-label="Previous"
                aria-disabled={page <= 1 ? "true" : undefined}
              >
                &larr;
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i
                return (
                  <Link
                    key={pageNum}
                    href={`?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`}
                    className={`admin-pagination-btn ${page === pageNum ? "active" : ""}`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              <Link
                href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`}
                className="admin-pagination-btn"
                aria-label="Next"
                aria-disabled={page >= totalPages ? "true" : undefined}
              >
                &rarr;
              </Link>
            </nav>
          )}
        </>
      ) : (
        <div className="admin-empty">
          <div className="admin-empty-num">00</div>
          <h3 className="admin-empty-title">NO ORDERS FOUND</h3>
          <p className="admin-empty-text">Orders will appear here once customers place purchases on the storefront.</p>
        </div>
      )}
    </div>
  )
}
