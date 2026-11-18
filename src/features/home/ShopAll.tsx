import { Icon } from "@/shared/components/Icon"
import { products } from "@/features/products/products"
import { t } from "@/shared/i18n"

/** Big link band that hands off to the full shop page. */
export function ShopAll() {
  return (
    <section className="shopall" aria-label={t("Shop the full drop")} data-reveal>
      <a className="shopall-link" href="#/shop">
        <span className="label">{t("AW25 —")} {products.length} {t("pieces")}</span>
        <span className="shopall-title">
          {t("Shop the full drop")}
          <Icon name="arrow" />
        </span>
      </a>
    </section>
  )
}
