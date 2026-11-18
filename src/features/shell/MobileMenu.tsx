import { LanguageSwitcher } from "@/shared/i18n/LanguageSwitcher"
import { type CSSProperties, type RefObject, useRef } from "react"
import { primaryLinks, socials } from "@/features/site-settings/navigation"
import { useDialog } from "@/shared/utils/useDialog"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { TenguMark } from "@/features/shell/TenguMark"
import { t, tr } from "@/shared/i18n"

export function MobileMenu({
  open,
  count,
  onClose,
  onCart,
  returnFocusRef,
}: {
  open: boolean
  count: number
  onClose: () => void
  onCart: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}) {
  const panel = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useDialog({
    open,
    onClose,
    containerRef: panel,
    initialFocusRef: closeButton,
    returnFocusRef,
  })

  return (
    <div
      ref={panel}
      id="mobile-menu"
      className={cn("mobile-menu", open && "is-open")}
      role="dialog"
      aria-modal="true"
      aria-label={t("Menu")}
      inert={!open}
    >
      <div className="mobile-menu-top">
        <span className="brand">
          <TenguMark />
        </span>
        <button
          ref={closeButton}
          type="button"
          className="nav-icon"
          aria-label={t("Close menu")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      <nav aria-label={t("Mobile navigation")}>
        <ul>
          {primaryLinks.map((link, index) => (
            <li key={link.label} style={{ "--i": index } as CSSProperties}>
              <a href={link.href} onClick={onClose}>
                <span className="mm-no">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mm-label">{tr(link.label)}</span>
                <Icon name="arrow" />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="mobile-menu-foot"
        style={{ "--i": primaryLinks.length } as CSSProperties}
      >
        <LanguageSwitcher />
        <a href="#/account" onClick={onClose}>
          <Icon name="user" /> {t("Account")}
        </a>
        <a href="#/wishlist" onClick={onClose}>
          <Icon name="heart" /> {t("Wishlist")}
        </a>
        <button type="button" onClick={onCart}>
          <Icon name="bag" /> {t("Bag ({count})", { count })}
        </button>
        <a href={socials[0].href} target="_blank" rel="noopener noreferrer">
          <Icon name="instagram" /> {t("Instagram")}
        </a>
      </div>
    </div>
  )
}
