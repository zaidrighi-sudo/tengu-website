import type { CSSProperties } from "react"
import { Hanko } from "@/features/shell/Hanko"
import { Icon } from "@/shared/components/Icon"
import { photos } from "@/features/products/products"
import { localized, siteSettings } from "@/features/site-settings/data"
import { t } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

/** Short, mysterious brand story. Doubles as the "About" anchor. */
export function Story() {
  if (!siteSettings.storyEnabled) return null

  return (
    <section className="story" id="manifesto" aria-labelledby="story-title">
      <StoreImage
        className="story-media photo"
        src={siteSettings.storyImage || photos.story}
        alt={siteSettings.storyImageAlt || ''}
        sizes="100vw"
      />
      <div className="story-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="story-inner">
        <p className="label" data-reveal>
          {localized(siteSettings.storyHeadline, t("04 — The legend"))}
        </p>
        <h2 id="story-title" className="story-title" data-reveal>
          {localized(siteSettings.storyBody, t("Something watches from the ridge."))}
        </h2>
        <div
          className="story-copy"
          data-reveal
          style={{ "--reveal-delay": "120ms" } as CSSProperties}
        >
          {siteSettings.storyCtaLink && (
            <a className="link-fwd" href={siteSettings.storyCtaLink}>
              {localized(siteSettings.storyCtaText, t("Read the legend"))} <Icon name="arrow" />
            </a>
          )}
          <Hanko className="story-hanko" size="3.5rem" />
        </div>
      </div>
    </section>
  )
}
