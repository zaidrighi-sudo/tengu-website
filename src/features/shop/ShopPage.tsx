import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Layout } from "@/features/shell/Layout"
import { ProductCard, ProductCardSkeleton } from "@/features/products/ProductCard"
import { FilterBar } from "@/features/shop/FilterBar"
import { FilterDrawer } from "@/features/shop/FilterDrawer"
import { useCart } from "@/features/cart/CartContext"
import { products } from "@/features/products/products"
import {
  EMPTY_FILTERS,
  type Filters,
  type SortKey,
  matches,
  parseHash,
  sortProducts,
  toHash,
} from "@/features/shop/utils"
import { useMediaQuery } from "@/features/shop/useMediaQuery"
import { t, tr } from "@/shared/i18n"

/** Pieces per page. 12 divides evenly into 1, 2, 3 and 4 columns. */
const PAGE = 12
/** Fake network latency so the skeleton states are visible. */
const FIRST_LOAD_MS = 900
const REFRESH_MS = 350
const LOAD_MORE_MS = 700

export default function Shop() {
  const { add } = useCart()
  const initial = useMemo(() => parseHash(window.location.hash), [])

  const addAndOpenCart = useCallback((product: any, size: any, color: any) => {
    add(product, size, color, { openCart: true })
  }, [add])
  const [filters, setFilters] = useState<Filters>(initial.filters)
  const [sort, setSort] = useState<SortKey>(initial.sort)
  const [colsMobile, setColsMobile] = useState(2)
  const [colsWide, setColsWide] = useState(4)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [busy, setBusy] = useState(true)
  const [visible, setVisible] = useState(PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const drawerButtonRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)

  const isTablet = useMediaQuery("(min-width: 48rem)")
  const isDesktop = useMediaQuery("(min-width: 64rem)")
  const cols = !isTablet
    ? colsMobile
    : isDesktop
      ? colsWide
      : Math.min(colsWide, 3)
  const colOptions = !isTablet ? [1, 2] : isDesktop ? [2, 3, 4] : [2, 3]
  const setCols = (n: number) => (isTablet ? setColsWide(n) : setColsMobile(n))

  const results = useMemo(
    () =>
      sortProducts(
        products.filter((product) => matches(product, filters)),
        sort,
      ),
    [filters, sort],
  )
  const shown = results.slice(0, visible)
  const remaining = results.length - shown.length

  // Keep the URL in step with the filters so views can be shared.
  const hash = toHash(filters, sort)
  useEffect(() => {
    if (window.location.hash !== hash) history.replaceState(null, "", hash)
  }, [hash])

  // Nav links (Hoodies, New Drop...) change the hash while this page is open.
  useEffect(() => {
    const onHashChange = () => {
      if (!window.location.hash.startsWith("#/shop")) return
      const next = parseHash(window.location.hash)
      setFilters(next.filters)
      setSort(next.sort)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // Any change to the query re-"fetches": show skeletons, reset paging.
  useEffect(() => {
    const delay = firstRun.current ? FIRST_LOAD_MS : REFRESH_MS
    if (!firstRun.current) {
      const wrap = wrapRef.current
      if (wrap && wrap.getBoundingClientRect().top < 0) {
        wrap.scrollIntoView({ block: "start" })
      }
    }
    firstRun.current = false
    setBusy(true)
    setVisible(PAGE)
    const timer = window.setTimeout(() => setBusy(false), delay)
    return () => window.clearTimeout(timer)
  }, [hash])

  const clearAll = useCallback(() => setFilters(EMPTY_FILTERS), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  function loadMore() {
    setLoadingMore(true)
    const firstNewId = results[visible]?.id
    window.setTimeout(() => {
      setVisible((count) => count + PAGE)
      setLoadingMore(false)
      // Move focus to the first new piece so keyboard users keep their place.
      requestAnimationFrame(() =>
        wrapRef.current
          ?.querySelector<HTMLElement>(`[data-pid="${firstNewId}"]`)
          ?.focus({ preventScroll: true }),
      )
    }, LOAD_MORE_MS)
  }

  const title =
    filters.category.length === 1
      ? filters.category[0]
      : filters.newOnly
        ? "New drop"
        : filters.saleOnly
          ? "Sale"
          : "Shop all"
  const searched = filters.search.trim()
  const percent = results.length
    ? Math.round((shown.length / results.length) * 100)
    : 0

  return (
    <Layout overlayHeader={false}>
      <div className="shop">
        <header className="shop-head">
          <nav aria-label={t("Breadcrumb")}>
            <ol className="crumbs">
              <li>
                <a href="#/">{t("Home")}</a>
              </li>
              <li aria-current="page">{t("Shop")}</li>
            </ol>
          </nav>
          <h1 className="shop-title">
            {searched && filters.category.length !== 1 && !filters.newOnly && !filters.saleOnly
              ? <>{t("Search results for")} &ldquo;{searched}&rdquo;</>
              : tr(title)}
          </h1>
          <p className="shop-intro">
            {t("AW25. Small runs, cut heavy. When a piece is gone, it is gone.")}
          </p>
        </header>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          resultCount={results.length}
          cols={cols}
          colOptions={colOptions}
          onColsChange={setCols}
          onOpenDrawer={() => setDrawerOpen(true)}
          drawerButtonRef={drawerButtonRef}
          onClear={clearAll}
        />

        <FilterDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          filters={filters}
          onChange={setFilters}
          onClear={clearAll}
          resultCount={results.length}
          returnFocusRef={drawerButtonRef}
        />

        {/* Screen-reader announcement for result changes. */}
        <p className="sr-only" role="status">
          {busy ? t("Loading pieces") : `${results.length} pieces`}
        </p>

        <div className="shop-results" ref={wrapRef}>
          {!busy && results.length === 0 ? (
            <div className="shop-empty">
              <p className="shop-empty-num" aria-hidden="true">
                00
              </p>
              <h2>{t("Nothing matches.")}</h2>
              <p>
                {t("No pieces fit this combination of filters. Remove a filter, or start again from the full drop.")}
              </p>
              <div className="shop-empty-actions">
                <button
                  type="button"
                  className="btn btn-solid btn-lg"
                  onClick={clearAll}
                >
                  {t("Clear all filters")}
                </button>
                <a className="btn btn-lg" href="#/shop">
                  {t("Shop all")}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div
                className="shop-grid"
                style={{ "--cols": cols } as CSSProperties}
                data-cols={cols}
                aria-busy={busy || loadingMore}
              >
                {busy
                  ? Array.from({ length: PAGE }, (_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))
                  : shown.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={(size, color) => addAndOpenCart(product, size, color)}
                      />
                    ))}
                {!busy &&
                  loadingMore &&
                  Array.from({ length: Math.min(PAGE, remaining) }, (_, i) => (
                    <ProductCardSkeleton key={`more-${i}`} />
                  ))}
              </div>

              {!busy && (
                <div className="shop-more">
                  <p className="label">
                    {t("Showing")} {shown.length} {t("of")} {results.length} {t("pieces")}
                  </p>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label={t("Pieces shown")}
                    aria-valuemin={0}
                    aria-valuemax={results.length}
                    aria-valuenow={shown.length}
                  >
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  {remaining > 0 ? (
                    <button
                      type="button"
                      className="btn btn-lg"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore
                        ? t("Loading")
                        : t("Load {v1} more", { v1: Math.min(PAGE, remaining) })}
                    </button>
                  ) : (
                    <p className="label">{t("You have seen every piece.")}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
