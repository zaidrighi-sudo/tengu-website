import {
  type FormEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { useAuth } from "@/store/context/AuthContext"
import { useCart } from "@/store/context/CartContext"
import { useWishlist } from "@/store/context/WishlistContext"
import { primaryLinks, searchSuggestions } from "@/store/data/navigation"
import { cn } from "@/store/utils/cn"
import { Icon } from "./Icon"
import { MegaMenu } from "./MegaMenu"
import { MobileMenu } from "./MobileMenu"
import { TenguMark } from "./TenguMark"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { localized, siteSettings } from "@/store/data/settings"
import { getLang, t, tr } from "@/store/i18n"

const DESKTOP = "(min-width: 64rem)"

export function Header({ overlay = true }: { overlay?: boolean }) {
  const { count, openCart } = useCart()
  const { user } = useAuth()
  const { ids: saved } = useWishlist()
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const megaItem = useRef<HTMLLIElement>(null)
  const megaTrigger = useRef<HTMLButtonElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const searchButton = useRef<HTMLButtonElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  // Transparent over the hero, solid once the page scrolls or a panel opens.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Escape closes the mega menu / search and hands focus back to its trigger.
  useEffect(() => {
    if (!megaOpen && !searchOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (megaOpen) {
        const inside = megaItem.current?.contains(document.activeElement)
        setMegaOpen(false)
        if (inside) megaTrigger.current?.focus()
      }
      if (searchOpen) {
        setSearchOpen(false)
        searchButton.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [megaOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus()
  }, [searchOpen])

  // Close the mobile menu if the viewport grows into the desktop layout.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)")
    const onChange = () => media.matches && setMenuOpen(false)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  const cancelClose = () => window.clearTimeout(closeTimer.current)
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 180)
  }
  // Hover only opens the menu for a real mouse on the desktop layout.
  const hoverOpen = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia(DESKTOP).matches)
      return
    cancelClose()
    setSearchOpen(false)
    setMegaOpen(true)
  }

  function toggleMega() {
    setSearchOpen(false)
    setMegaOpen((open) => !open)
  }

  function toggleSearch() {
    setMegaOpen(false)
    setSearchOpen((open) => !open)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = (searchInput.current?.value ?? "").replace(/\s+/g, " ").trim()
    setSearchOpen(false)
    window.location.hash = query
      ? `#/shop?search=${encodeURIComponent(query)}`
      : "#/shop"
  }

  const solid = !overlay || scrolled || megaOpen || searchOpen
  const bagLabel = t("Open bag, {count} {unit}", {
    count,
    unit: count === 1 ? t("item") : t("items"),
  })

  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to content")}
      </a>

      <div className="announcement">
        <p className="announcement-side">{localized(siteSettings.announcementLeft, t("Cash on delivery"))}</p>
        <p className="announcement-main">
          {localized(siteSettings.announcementCenter, t("Fast delivery to all 58 wilayas"))}
          {getLang() !== "ar" && siteSettings.announcementCenter.ar && (
            <span className="announcement-accent" lang="ar" dir="rtl">
              {siteSettings.announcementCenter.ar}
            </span>
          )}
        </p>
        <p className="announcement-side">{localized(siteSettings.announcementRight, t("Easy exchange"))}</p>
      </div>

      <header
        className={cn(
          "site-header",
          overlay && "is-overlay",
          solid && "is-solid",
        )}
        onMouseLeave={scheduleClose}
      >
        <div className="site-header-inner">
          <a className="brand" href="#/" aria-label={t("Tengu home")}>
            <TenguMark />
          </a>

          <nav className="primary-nav" aria-label={t("Main navigation")}>
            <ul>
              {primaryLinks.map((link) =>
                link.mega ? (
                  <li
                    key={link.label}
                    ref={megaItem}
                    onPointerEnter={hoverOpen}
                    onBlur={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      ) {
                        setMegaOpen(false)
                      }
                    }}
                  >
                    <button
                      ref={megaTrigger}
                      type="button"
                      className="nav-link"
                      aria-expanded={megaOpen}
                      aria-controls="mega-menu"
                      onClick={toggleMega}
                    >
                      {tr(link.label)}
                      <span className="nav-caret" aria-hidden="true" />
                    </button>
                    <MegaMenu
                      open={megaOpen}
                      onNavigate={() => setMegaOpen(false)}
                      onDismiss={() => setMegaOpen(false)}
                    />
                  </li>
                ) : (
                  <li key={link.label} onMouseEnter={() => setMegaOpen(false)}>
                    <a className="nav-link" href={link.href}>
                      {tr(link.label)}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="nav-actions">
            <LanguageSwitcher />
            <button
              ref={searchButton}
              type="button"
              className="nav-icon"
              aria-label={searchOpen ? t("Close search") : t("Search")}
              aria-expanded={searchOpen}
              aria-controls="search-panel"
              onClick={toggleSearch}
            >
              <Icon name={searchOpen ? "close" : "search"} />
            </button>
            <a
              className="nav-icon nav-wish"
              href="#/wishlist"
              aria-label={t("Wishlist, {length} saved", { length: saved.length })}
            >
              <Icon name="heart" />
              {saved.length > 0 && (
                <span className="cart-count" aria-hidden="true">
                  {saved.length}
                </span>
              )}
            </a>
            <a
              className="nav-icon nav-account"
              href="#/account"
              aria-label={user ? t("Account, {name}", { name: user.firstName }) : t("Sign in")}
            >
              <Icon name="user" />
              {user && <span className="nav-signed" aria-hidden="true" />}
            </a>
            <button
              type="button"
              className="nav-icon nav-cart"
              aria-label={tr(bagLabel)}
              aria-haspopup="dialog"
              aria-controls="cart-drawer"
              onClick={() => {
                setMegaOpen(false)
                setSearchOpen(false)
                openCart()
              }}
            >
              <Icon name="bag" />
              {count > 0 && (
                <span key={count} className="cart-count" aria-hidden="true">
                  {count}
                </span>
              )}
            </button>
            <button
              ref={menuButton}
              type="button"
              className="nav-icon nav-menu"
              aria-label={t("Open menu")}
              aria-haspopup="dialog"
              aria-controls="mobile-menu"
              onClick={() => {
                setSearchOpen(false)
                setMenuOpen(true)
              }}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>

        <div
          id="search-panel"
          className={cn("search-panel", searchOpen && "is-open")}
          inert={!searchOpen}
        >
          <form role="search" onSubmit={submitSearch}>
            <label htmlFor="site-search">{t("Search Tengu")}</label>
            <div className="search-field">
              <Icon name="search" />
              <input
                ref={searchInput}
                id="site-search"
                type="search"
                placeholder={t("Search hoodies, joggers…")}
                autoComplete="off"
              />
            </div>
          </form>
          <div className="search-suggestions">
            <span>{t("Popular")}</span>
            {searchSuggestions.map((term) => (
              <a
                key={term.label}
                href={term.href}
                onClick={() => setSearchOpen(false)}
              >
                {tr(term.label)}
              </a>
            ))}
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        count={count}
        returnFocusRef={menuButton}
        onClose={() => setMenuOpen(false)}
        onCart={() => {
          setMenuOpen(false)
          openCart()
        }}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {t("{count} {unit} in your bag", { count, unit: count === 1 ? t("item") : t("items") })}
      </p>
    </>
  )
}
