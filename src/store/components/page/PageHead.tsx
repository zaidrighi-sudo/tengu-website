import type { ReactNode } from "react"
import { t, tr } from "@/store/i18n"

/** Shared header for editorial and utility pages. */
export function PageHead({
  title,
  crumb,
  eyebrow,
  intro,
  children,
}: {
  title: ReactNode
  /** Breadcrumb label; defaults to the title. */
  crumb?: string
  eyebrow?: string
  intro?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="page-head">
      <nav aria-label={t("Breadcrumb")}>
        <ol className="crumbs">
          <li>
            <a href="#/">{t("Home")}</a>
          </li>
          <li aria-current="page">
            {crumb ?? (typeof title === "string" ? title : t("Page"))}
          </li>
        </ol>
      </nav>
      {eyebrow && <p className="label">{tr(eyebrow)}</p>}
      <h1 className="page-title">{tr(title)}</h1>
      {intro && <p className="page-intro">{tr(intro)}</p>}
      {children}
    </header>
  )
}
