import Link from "next/link"
import { getCustomers, getLifetimeDeliveredSpendForUsers } from "@/lib/admin/actions"
import { formatCurrency, formatDate } from "@/lib/admin/helpers"
import "@/store/styles/global.css"
import "../admin.css"

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""

  const { docs: customers, totalDocs, totalPages } = await getCustomers(page, 20, search)
  // One aggregate for the visible page: lifetime delivered spend per customer.
  const spends = await getLifetimeDeliveredSpendForUsers(customers.map((customer) => customer._id))

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">CUSTOMERS</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 05 / CUSTOMERS · 顧客管理 ]</div>
            <h1 className="admin-page-title">CUSTOMERS</h1>
            <p className="admin-page-subtitle">
              Review registered customer accounts, lifetime delivered spend, and contact details.
            </p>
          </div>
          <span className="admin-filter-count">
            {totalDocs} REGISTERED USERS
          </span>
        </div>
      </header>

      {/* Search Toolbar */}
      <form className="admin-toolbar" method="GET">
        <div className="admin-search">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="SEARCH CUSTOMERS BY NAME, EMAIL, PHONE..."
            className="admin-search-input"
            aria-label="Search customers"
          />
        </div>
        <div className="admin-filters">
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            SEARCH
          </button>
          {search && (
            <Link href="/manage/customers" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Customers Table */}
      {customers.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th style={{ textAlign: "right" }}>DELIVERED SPEND</th>
                  <th style={{ textAlign: "right" }}>JOINED</th>
                  <th style={{ width: "80px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>
                        {customer.firstName} {customer.lastName}
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      {customer.email}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      {customer.phone || "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatCurrency(spends[customer._id] ?? 0)}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                      {formatDate(customer.createdAt.toISOString())}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions">
                        <Link href={`/manage/customers/${customer._id}/edit`} className="admin-action-btn" title="View Customer">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5a2.121 2.121 0 0 1 3 3Z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Pagination">
              <Link
                href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                className="admin-pagination-btn"
                aria-label="Previous"
                aria-disabled={page <= 1 ? "true" : undefined}
              >
                &larr;
              </Link>
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i + 1}
                  href={`?page=${i + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`admin-pagination-btn ${page === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </Link>
              ))}
              <Link
                href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
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
          <h3 className="admin-empty-title">NO CUSTOMERS FOUND</h3>
          <p className="admin-empty-text">No registered customer accounts found matching your query.</p>
        </div>
      )}
    </div>
  )
}
