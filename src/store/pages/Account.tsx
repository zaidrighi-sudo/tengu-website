import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import { AddressesTab } from "@/store/components/account/AddressesTab"
import { OrdersTab } from "@/store/components/account/OrdersTab"
import { ProfileTab } from "@/store/components/account/ProfileTab"
import { WishlistPanel } from "@/store/components/account/WishlistPanel"
import { SpendProgress } from "@/store/components/cart/SpendProgress"
import { Layout } from "@/store/components/Layout"
import { PageHead } from "@/store/components/page/PageHead"
import { useAuth } from "@/store/context/AuthContext"
import { useWishlist } from "@/store/context/WishlistContext"
import { loadOrders } from "@/store/utils/checkout"
import { cn } from "@/store/utils/cn"
import { parseHash, replaceHash, useHash } from "@/store/utils/useHash"
import { t, tr, dateFormatter } from "@/store/i18n"

const TABS = ["orders", "addresses", "wishlist", "profile"] as const
type Tab = (typeof TABS)[number]

const since = dateFormatter({ month: "long", year: "numeric" })

export default function Account() {
  const { user, logout } = useAuth()
  const { ids } = useWishlist()
  const hash = useHash()
  const requested = parseHash(hash).params.get("tab")
  const tab: Tab = TABS.find((t) => t === requested) ?? "orders"
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const signingOut = useRef(false)
  const [, refresh] = useState(0)

  // Guests are sent to sign in, then back here.
  useEffect(() => {
    const hash = window.location.hash
    if (!user && !signingOut.current && hash.startsWith("#/account")) replaceHash(`#/login?next=${encodeURIComponent(hash)}`)
  }, [user])

  if (!user) return null

  const orderCount = loadOrders().filter((o) => o.email.toLowerCase() === user.email).length
  const counts: Record<Tab, number | null> = {
    orders: orderCount,
    addresses: user.addresses.length,
    wishlist: ids.length,
    profile: null,
  }

  // Tabs keep the URL in sync without stacking history entries.
  const select = (next: Tab, focus = false) => {
    window.history.replaceState(null, "", `#/account?tab=${next}`)
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    if (focus) tabRefs.current[next]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const index = TABS.indexOf(tab)
    const move: Record<string, number> = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }
    if (event.key in move) {
      event.preventDefault()
      select(TABS[move[event.key]], true)
    }
  }

  return (
    <Layout overlayHeader={false}>
      <div className="acct">
        <PageHead
          crumb={t("Account")}
          eyebrow={t("Member since {v1}", { v1: since.format(new Date(user.createdAt)) })}
          title={`Hi, ${user.firstName}.`}
        >
          <div className="acct-head-actions">
            <p className="acct-email">{tr(user.email)}</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                signingOut.current = true
                logout()
                window.location.hash = "#"
              }}
            >
              {t("Sign out")}
            </button>
          </div>
        </PageHead>

        <div className="acct-body">
          {/* Loyalty: lifetime delivered spend progress toward free home delivery */}
          <section className="acct-loyalty" aria-label={t("Loyalty")}>
            <h2 className="acct-h">{t("Loyalty")}</h2>
            <SpendProgress />
          </section>
          <div className="acct-tabs-wrap">
            <div className="acct-tabs" role="tablist" aria-label={t("Account sections")} onKeyDown={onKeyDown}>
              {TABS.map((id) => (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[id] = el
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  className={cn("acct-tab", tab === id && "is-active")}
                  onClick={() => select(id)}
                >
                  {id[0].toUpperCase() + id.slice(1)}
                  {counts[id] !== null && <span className="acct-count">{counts[id]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="acct-panel">
            {tab === "orders" && <OrdersTab key={user.id} user={user} onChange={() => refresh((n) => n + 1)} />}
            {tab === "addresses" && <AddressesTab user={user} />}
            {tab === "wishlist" && <WishlistPanel />}
            {tab === "profile" && <ProfileTab key={user.id} user={user} />}
          </div>
        </div>
      </div>
    </Layout>
  )
}
