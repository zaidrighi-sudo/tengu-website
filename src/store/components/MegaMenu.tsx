import type { CSSProperties } from "react"
import { megaCards, megaLinks } from "@/store/data/navigation"
import { cn } from "@/store/utils/cn"
import { Icon } from "./Icon"
import { t, tr } from "@/store/i18n"
import { StoreImage } from "@/store/components/StoreImage"

/** Full-screen desktop mega menu: quick links plus category image cards. */
export function MegaMenu({
  open,
  onNavigate,
  onDismiss,
  /** Pointer wandered onto (or clicked) the empty area around the content. */
}: {
  open: boolean
  onNavigate: () => void
  onDismiss: () => void
}) {
  return (
    <div
      id="mega-menu"
      className={cn("mega", open && "is-open")}
      inert={!open}
      aria-label={t("Shop categories")}
      role="region"
      onClick={(event) => event.target === event.currentTarget && onDismiss()}
      onPointerMove={(event) =>
        event.pointerType === "mouse" &&
        event.target === event.currentTarget &&
        onDismiss()
      }
    >
      <div className="mega-inner">
        <div className="mega-links">
          <p className="label">{t("Shop")}</p>
          <ul>
            {megaLinks.map((link, index) => (
              <li key={link.label} style={{ "--i": index } as CSSProperties}>
                <a href={link.href} onClick={onNavigate}>
                  {tr(link.label)}
                  <Icon name="arrow" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mega-cards">
          {megaCards.map((card, index) => (
            <li key={card.label} style={{ "--i": index } as CSSProperties}>
              <a className="mega-card" href={card.href} onClick={onNavigate}>
                <span className="mega-card-media">
                  <StoreImage className="photo" src={card.image} alt="" />
                </span>
                <span className="mega-card-text">
                  <span className="mega-card-title">{tr(card.label)}</span>
                  <span className="label">{tr(card.note)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
