import Link from "next/link"
import { getProducts, getCategories, deleteProduct } from "@/lib/admin/actions"
import { formatCurrency } from "@/lib/admin/helpers"
import "@/store/styles/global.css"
import "../admin.css"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string }>
}) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1", 10)
  const search = resolvedParams.search || ""
  const category = resolvedParams.category || ""

  const { docs: products, totalDocs, totalPages } = await getProducts(page, 20, search, category)
  const categories = await getCategories()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">PRODUCTS</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 02 / CATALOG · 商品管理 ]</div>
            <h1 className="admin-page-title">PRODUCTS</h1>
            <p className="admin-page-subtitle">
              Manage apparel pieces, set prices, assign categories, and control storefront visibility.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/manage/products/new" className="admin-btn admin-btn-primary">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Add Product</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search & Filter Toolbar (Shop Filter Bar Style) */}
      <form className="admin-toolbar" method="GET">
        <div className="admin-search">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="SEARCH PRODUCTS BY TITLE OR SLUG..."
            className="admin-search-input"
            aria-label="Search products"
          />
        </div>
        <div className="admin-filters">
          <select name="category" className="admin-filter-select" defaultValue={category}>
            <option value="">ALL CATEGORIES</option>
            {categories.map((cat) => (
              <option key={String(cat._id)} value={String(cat._id)}>
                {cat.name.toUpperCase()}
              </option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-sm admin-btn-primary">
            FILTER
          </button>
          {(search || category) && (
            <Link href="/manage/products" className="admin-btn admin-btn-sm admin-btn-ghost">
              CLEAR
            </Link>
          )}
        </div>
      </form>

      {/* Products Table */}
      {products.length > 0 ? (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "64px" }}>IMAGE</th>
                  <th>PIECE</th>
                  <th>CATEGORY</th>
                  <th style={{ textAlign: "right" }}>PRICE</th>
                  <th style={{ textAlign: "center" }}>FLAG</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                  <th style={{ width: "90px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={String(product._id)}>
                    <td>
                      {product.image ? (
                        <div style={{ width: "48px", height: "56px", background: "var(--admin-surface-raised)", overflow: "hidden" }}>
                          <img
                            src={product.image.url || `/api/media/file/${product.image._id}`}
                            alt={product.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: "48px", height: "56px", background: "var(--admin-surface)", border: "1px dashed var(--admin-border)" }} />
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#ffffff" }}>{product.name}</div>
                      <div style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", color: "var(--admin-muted)" }}>
                        /{product.slug}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {product.category?.name || "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {formatCurrency(product.price)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {product.status ? (
                        <span className={`admin-tag ${product.status === "sale" ? "admin-tag-sale" : product.status === "soldout" ? "admin-tag-out" : ""}`}>
                          {product.status}
                        </span>
                      ) : (
                        <span style={{ color: "var(--admin-subtle)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`admin-status ${product.active ? "admin-status-active" : "admin-status-archived"}`}>
                        {product.active ? "PUBLISHED" : "HIDDEN"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="admin-actions">
                        <Link href={`/manage/products/${String(product._id)}/edit`} className="admin-action-btn" title="Edit Piece">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}>
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5a2.121 2.121 0 0 1 3 3Z" />
                          </svg>
                        </Link>
                        <form action={deleteProduct.bind(null, String(product._id))} style={{ display: "inline" }}>
                          <button type="submit" className="admin-action-btn delete" title="Delete Piece">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="admin-pagination" aria-label="Pagination">
              <Link
                href={`?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
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
                    href={`?page=${pageNum}${search ? `&search=${encodeURIComponent(search)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                    className={`admin-pagination-btn ${page === pageNum ? "active" : ""}`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              <Link
                href={`?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
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
          <h3 className="admin-empty-title">NO PIECES FOUND</h3>
          <p className="admin-empty-text">No apparel items match the selected category or search filter.</p>
          <Link href="/manage/products/new" className="admin-btn admin-btn-primary">
            Add Product
          </Link>
        </div>
      )}
    </div>
  )
}
