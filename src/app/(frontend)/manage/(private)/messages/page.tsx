import Link from "next/link"
import { getMessages, updateMessageStatus } from "@/lib/admin/actions/messages"
import { formatDate } from "@/lib/admin/helpers"
import "@/store/styles/global.css"
import "../admin.css"

async function updateMessageStatusAction(formData: FormData) {
  "use server"
  await updateMessageStatus(String(formData.get("id")), String(formData.get("status")))
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""
  const status = resolvedParams.status || ""

  const { docs: messages, totalDocs, totalPages } = await getMessages(page, 20, search, status)

  const statuses = [
    { value: "", label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "answered", label: "Answered" },
    { value: "archived", label: "Archived" },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">MESSAGES</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 07 / INQUIRIES · お問い合わせ ]</div>
            <h1 className="admin-page-title">MESSAGES</h1>
            <p className="admin-page-subtitle">
              Review customer contact form messages, inquiries, and status updates.
            </p>
          </div>
          <span className="admin-filter-count">
            {totalDocs} INQUIRIES
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
            placeholder="SEARCH MESSAGES BY SENDER OR SUBJECT..."
            className="admin-search-input"
            aria-label="Search messages"
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
            <Link href="/manage/messages" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Messages Table */}
      {messages.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SENDER</th>
                  <th>SUBJECT / PREVIEW</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                  <th style={{ textAlign: "right" }}>RECEIVED</th>
                  <th style={{ width: "160px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{message.name}</div>
                      <div style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--admin-muted)" }}>
                        {message.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#ffffff" }}>{message.topic || "General Inquiry"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)", maxWidth: "30rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {message.message}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`admin-status admin-status-${message.status}`}>
                        {message.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                      {formatDate(message.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <form
                        action={updateMessageStatusAction}
                        style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}
                      >
                        <input type="hidden" name="id" value={String(message._id)} />
                        <select name="status" className="admin-filter-select" defaultValue={message.status} style={{ padding: "0.35rem 0.5rem", fontSize: "0.6875rem" }}>
                          <option value="new">NEW</option>
                          <option value="answered">ANSWERED</option>
                          <option value="archived">ARCHIVED</option>
                        </select>
                        <button type="submit" className="admin-btn admin-btn-sm admin-btn-secondary" style={{ minHeight: "1.75rem", padding: "0 0.5rem" }}>
                          OK
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              {Array.from({ length: totalPages }, (_, i) => (
                <Link
                  key={i + 1}
                  href={`?page=${i + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}`}
                  className={`admin-pagination-btn ${page === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </Link>
              ))}
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
          <h3 className="admin-empty-title">NO MESSAGES FOUND</h3>
          <p className="admin-empty-text">No customer contact form inquiries match the active filter.</p>
        </div>
      )}
    </div>
  )
}
