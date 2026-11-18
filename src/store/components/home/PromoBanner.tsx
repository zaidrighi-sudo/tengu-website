import { Icon } from "@/store/components/Icon"
import { localized, siteSettings } from "@/store/data/settings"
import { t } from "@/store/i18n"
import { StoreImage } from "@/store/components/StoreImage"

export function PromoBanner() {
  if (!siteSettings.promoEnabled) return null

  const alignment = siteSettings.promoAlignment ?? 'center'
  const colorScheme = siteSettings.promoColorScheme ?? 'dark'

  const textColor = colorScheme === 'dark' ? 'text-white' : 'text-black'
  const shadeClass = colorScheme === 'dark' ? 'promo-shade-dark' : 'promo-shade-light'

  return (
    <section
      className={`promo-banner ${alignment} ${colorScheme}`}
      aria-labelledby="promo-title"
      style={siteSettings.promoImage ? { backgroundImage: `url(${siteSettings.promoImage})` } : undefined}
    >
      <div className={shadeClass} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="promo-content" data-reveal>
        <p className={`label promo-eyebrow ${textColor}`}>
          {localized(siteSettings.promoHeadline, '')}
        </p>
        <h2 id="promo-title" className={`promo-headline ${textColor}`} data-reveal>
          {localized(siteSettings.promoSubtext, '')}
        </h2>
        {siteSettings.promoCtaLink && (
          <a className={`btn btn-solid btn-lg promo-cta ${textColor}`} href={siteSettings.promoCtaLink}>
            {localized(siteSettings.promoCtaText, t('Shop now'))} <Icon name="arrow" />
          </a>
        )}
      </div>
    </section>
  )
}