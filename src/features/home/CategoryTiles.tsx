import type { CSSProperties } from "react"
import { Icon } from "@/store/components/Icon"
import { SectionHeading } from "@/features/shell/SectionHeading"
import { products } from "@/features/products/products"
import { getFeaturedCategories } from "@/features/site-settings/data"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

export function CategoryTiles() {
  const featuredCategories = getFeaturedCategories()
  return (
    <section className="tiles" aria-labelledby="tiles-title">
      <div className="tiles-head" data-reveal>
        <div id="tiles-title">
          <SectionHeading index="01" title={t("Shop by category")} compact />
        </div>
      </div>

      <ul className="tiles-grid">
        {featuredCategories.map((tile, i) => {
          const count = products.filter(
            (product) => product.category === tile.name,
          ).length
          return (
            <li
              key={tile.name}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as CSSProperties}
            >
              <a className="tile" href={tile.href}>
                <span className="tile-media">
                  <StoreImage className="photo tile-img" src={tile.image} alt={tr(tile.alt)} />
                  <StoreImage className="photo tile-img tile-img-alt" src={tile.hoverImage} alt="" />
                </span>
                <span className="tile-shade" aria-hidden="true" />
                <span className="tile-body">
                  <span className="label tile-count">
                    {String(count).padStart(2, "0")} {t("pieces")}
                  </span>
                  <span className="tile-name">{tr(tile.name)}</span>
                </span>
                <span className="tile-arrow" aria-hidden="true">
                  <Icon name="arrow" />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
