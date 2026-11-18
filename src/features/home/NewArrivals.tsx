import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "@/store/components/Icon"
import { ProductCard } from "@/features/products/ProductCard"
import { SectionHeading } from "@/features/shell/SectionHeading"
import { useCart } from "@/features/cart/CartContext"
import { getFeaturedProducts } from "@/features/site-settings/data"
import { t } from "@/shared/i18n"

export function NewArrivals() {
  const arrivals = getFeaturedProducts()
  const { add } = useCart()
  const trackRef = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const addAndOpenCart = useCallback((product: any, size: any, color: any) => {
    add(product, size, color, { openCart: true })
  }, [add])

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setEdge({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  function page(direction: 1 | -1) {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>(".product-card")
    const step = (card?.offsetWidth ?? track.clientWidth / 2) * 2
    track.scrollBy({ left: step * direction, behavior: "smooth" })
  }

  return (
    <section
      className="arrivals"
      id="new-arrivals"
      aria-labelledby="arrivals-title"
    >
      <div className="arrivals-head" data-reveal>
        <div id="arrivals-title">
          <SectionHeading index="02" title={t("New arrivals")} compact />
        </div>
        <div className="arrivals-controls">
          <a className="arrivals-all" href="#/shop">
            {t("View all")} <Icon name="arrow" />
          </a>
          <div className="arrivals-arrows">
            <button
              type="button"
              className="arrow-btn is-prev"
              aria-label={t("Previous pieces")}
              disabled={edge.start}
              onClick={() => page(-1)}
            >
              <Icon name="arrow" />
            </button>
            <button
              type="button"
              className="arrow-btn"
              aria-label={t("Next pieces")}
              disabled={edge.end}
              onClick={() => page(1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable region: focusable so keyboard users can scroll it. */}
      <div
        className="arrivals-track"
        ref={trackRef}
        onScroll={measure}
        tabIndex={0}
        role="region"
        aria-label={t("New arrivals, scrollable")}
        data-reveal
      >
        {arrivals.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={(size, color) => addAndOpenCart(product, size, color)}
          />
        ))}
      </div>
    </section>
  )
}
