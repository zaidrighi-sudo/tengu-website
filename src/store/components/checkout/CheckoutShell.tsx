import type { ReactNode } from "react"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { Icon } from "../Icon"
import { TenguMark } from "../TenguMark"
import { contactEmail } from "@/store/data/settings"
import { t } from "@/store/i18n"

/** Distraction-free chrome for checkout: logo, secure label, way back. */
export function CheckoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to content")}
      </a>
      <header className="co-header">
        <div className="co-header-row">
          <a className="brand" href="#/" aria-label={t("Tengu, home")}>
            <TenguMark />
          </a>
          <p className="co-secure">
            <Icon name="lock" /> {t("Secure checkout")}
          </p>
          <div className="co-header-end">
            <LanguageSwitcher />
            <a className="co-back" href="#/cart">
              <span>{t("Return to bag")}</span>
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="co-main-wrap">
        {children}
      </main>
      <footer className="co-footer">
        <p>{t("© 2025 Tengu. Cash on delivery. Easy exchange.")}</p>
        <a href={`mailto:${contactEmail()}`}>{t("Need help? {email}", { email: contactEmail() })}</a>
      </footer>
    </>
  )
}
