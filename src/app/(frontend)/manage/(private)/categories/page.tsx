import Link from "next/link"
import { getCategoriesPaginated, deleteCategory } from "@/lib/admin/actions/categories"
import "@/store/styles/global.css"
import "../admin.css"

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""

  const { docs: categories, totalDocs, totalPages } = await getCategoriesPaginated(page, 20, search)

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">CATEGORIES</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 03 / CATEGORIES · カテゴリー ]</div>
            <h1 className="admin-page-title">CATEGORIES</h1>
            <p className="admin-page-subtitle">
              Configure collection categories, navigation taxonomy, and visual tile banners.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/manage/categories/new" className="admin-btn admin-btn-primary">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Add Category</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Toolbar */}
      <form className="admin-toolbar" method="GET">
        <div className="admin-search">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="SEARCH CATEGORIES BY TITLE..."
            className="admin-search-input"
            aria-label="Search categories"
          />
        </div>
        <div className="admin-filters">
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            SEARCH
          </button>
          {search && (
            <Link href="/manage/categories" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Categories Table */}
      {categories.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>SLUG</th>
                  <th style={{ textAlign: "center" }}>SORT ORDER</th>
                  <th>TILE BANNER</th>
                  <th style={{ width: "90px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#ffffff", textTransform: "uppercase" }}>
                        {category.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                      /{category.slug}
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>
                      {category.sortOrder || 0}
                    </td>
                    <td>
                      {category.tileImage ? (
                        <div style={{ width: "72px", height: "36px", background: "var(--admin-surface-raised)", overflow: "hidden" }}>
                          <img
                            src={category.tileImage.url || `/api/media/file/${category.tileImage._id}`}
                            alt={category.tileAlt || category.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <span style={{ color: "var(--admin-subtle)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions">
                        <Link href={`/manage/categories/${category._id}/edit`} className="admin-action-btn" title="Edit Category">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5a2.121 2.121 0 0 1 3 3Z" />
                          </svg>
                        </Link>
                        <form action={deleteCategory.bind(null, String(category._id))} style={{ display: "inline" }}>
                          <button type="submit" className="admin-action-btn delete" title="Delete Category">
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
          <h3 className="admin-empty-title">NO CATEGORIES FOUND</h3>
          <p className="admin-empty-text">No product categories have been configured yet.</p>
          <Link href="/manage/categories/new" className="admin-btn admin-btn-primary">
            Add Category
          </Link>
        </div>
      )}
    </div>
  )
}
