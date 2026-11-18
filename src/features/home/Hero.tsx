import type { CSSProperties } from "react"
import { Icon } from "@/shared/components/Icon"
import { localized, siteSettings } from "@/features/site-settings/data"
import { photos } from "@/features/products/products"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

const LETTERS = ["T", "E", "N", "G", "U"]

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <StoreImage className="hero-media photo" src={photos.hero} alt={siteSettings.heroImageAlt || t("Model in a black Tengu hoodie standing in a concrete parking structure")} priority sizes="100vw" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {/* Decorative vertical kanji for "tengu". */}
      <p className="hero-kanji jp" lang="ja" aria-hidden="true">
        天狗
      </p>

      <div className="hero-content">
        <p className="label hero-eyebrow">{localized(siteSettings.heroEyebrow, t("AW25 — Mountain Spirit"))}</p>

        <div className="hero-bottom">
          <h1 id="hero-title" className="hero-title" aria-label={t("Tengu")}>
            <span aria-hidden="true">
              {LETTERS.map((letter, i) => (
                <span
                  key={letter}
                  className="hero-letter"
                  style={{ "--i": i } as CSSProperties}
                >
                  {tr(letter)}
                </span>
              ))}
            </span>
          </h1>

          <div className="hero-row">
            <p className="hero-copy">
              {localized(siteSettings.heroCopy, t("Heavyweight hoodies and technical joggers. Cut for the street, disciplined like the mountain."))}
            </p>
            <a className="btn btn-solid btn-lg hero-cta" href="#/shop">
              {t("Shop the Drop")} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
