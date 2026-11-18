import Link from "next/link"
import { getSubscribers, deleteSubscriber } from "@/features/subscribers/backend"
import { formatDate } from "@/features/admin/helpers"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""

  const { docs: subscribers, totalDocs, totalPages } = await getSubscribers(page, 20, search)

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">SUBSCRIBERS</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 08 / NEWSLETTER · 購読者 ]</div>
            <h1 className="admin-page-title">SUBSCRIBERS</h1>
            <p className="admin-page-subtitle">
              Manage newsletter mailing list subscribers, locale preferences, and sign-up dates.
            </p>
          </div>
          <span className="admin-filter-count">
            {totalDocs} ACTIVE SUBSCRIBERS
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
            placeholder="SEARCH SUBSCRIBERS BY EMAIL..."
            className="admin-search-input"
            aria-label="Search subscribers"
          />
        </div>
        <div className="admin-filters">
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            SEARCH
          </button>
          {search && (
            <Link href="/manage/subscribers" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Subscribers Table */}
      {subscribers.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>EMAIL ADDRESS</th>
                  <th style={{ textAlign: "center" }}>LANGUAGE</th>
                  <th style={{ textAlign: "right" }}>JOINED</th>
                  <th style={{ width: "80px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber._id}>
                    <td>
                      <span style={{ fontWeight: 600, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                        {subscriber.email}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="admin-tag admin-tag-out">
                        {subscriber.language.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                      {formatDate(subscriber.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions">
                        <form action={deleteSubscriber.bind(null, String(subscriber._id))} style={{ display: "inline" }}>
                          <button type="submit" className="admin-action-btn delete" title="Unsubscribe">
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </form>
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
          <h3 className="admin-empty-title">NO SUBSCRIBERS FOUND</h3>
          <p className="admin-empty-text">No newsletter subscribers match your search.</p>
        </div>
      )}
    </div>
  )
}
