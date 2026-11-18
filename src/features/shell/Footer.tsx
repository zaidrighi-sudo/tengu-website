import { footerColumns, socials } from "@/features/site-settings/navigation"
import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher"
import { Hanko } from "@/features/shell/Hanko"
import { Icon } from "@/shared/components/Icon"
import { NewsletterForm } from "@/features/subscribers/NewsletterForm"
import { TenguMark } from "@/features/shell/TenguMark"
import { getLang, t, tr } from "@/shared/i18n"

export function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="footer-grid">
        <div className="footer-intro">
          <a className="footer-logo" href="#/" aria-label={t("Tengu home")}>
            <TenguMark />
          </a>
          <p>
            {t("Streetwear from the mountain. New drops, restocks and quiet announcements. Nothing unnecessary.")}
          </p>
          <ul className="footer-dz" aria-label={t("Delivery and payment")}>
            <li>{t("Cash on delivery")}</li>
            <li>{t("dhd, 58 wilayas")}</li>
            {getLang() !== "ar" && (
              <li lang="ar" dir="rtl">
                الدفع عند الاستلام
              </li>
            )}
          </ul>
          <NewsletterForm />
        </div>

        <nav className="footer-columns" aria-label={t("Footer")}>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2>{tr(column.title)}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{tr(link.label)}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <p className="footer-mega" aria-hidden="true">
        {t("TENGU")}
      </p>

      <div className="footer-bottom">
        <Hanko size="2.75rem" />
        <span>{t("© 2025 Tengu. Made for Algeria.")}</span>
        <ul className="footer-socials" aria-label={t("Social media")}>
          {socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                aria-label={tr(social.label)}
                {...(social.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <Icon name={social.icon} />
              </a>
            </li>
          ))}
        </ul>
        <LanguageSwitcher />
      </div>
    </footer>
  )
}
