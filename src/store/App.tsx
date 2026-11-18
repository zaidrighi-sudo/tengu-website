import { type ComponentType, useEffect, useRef, useState } from "react"
import { Fragment } from "react"
import { tr, t, useLang } from "@/store/i18n"
import { AuthProvider, type User } from "@/store/context/AuthContext"
import { CartProvider } from "./context/CartContext"
import { WishlistProvider } from "./context/WishlistContext"
import About from "./pages/About"
import Account from "./pages/Account"
import { Forgot, Login, Register } from "./pages/Auth"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Contact from "./pages/Contact"
import Faq from "./pages/Faq"
import Home from "./pages/Home"
import Lookbook from "./pages/Lookbook"
import NotFound from "./pages/NotFound"
import Order from "./pages/Order"
import Shop from "./pages/Shop"
import ShippingReturns from "./pages/ShippingReturns"
import SizeGuide from "./pages/SizeGuide"
import Wishlist from "./pages/Wishlist"

/** Page routes: the first segment after `#/`, with the title for the tab. */
const PAGES = {
  shop: { page: Shop, title: "Shop" },
  cart: { page: Cart, title: "Your bag" },
  checkout: { page: Checkout, title: "Checkout" },
  order: { page: Order, title: "Order confirmed" },
  login: { page: Login, title: "Sign in" },
  register: { page: Register, title: "Create account" },
  forgot: { page: Forgot, title: "Forgot password" },
  account: { page: Account, title: "Account" },
  wishlist: { page: Wishlist, title: "Wishlist" },
  about: { page: About, title: "The legend" },
  lookbook: { page: Lookbook, title: "Lookbook" },
  "size-guide": { page: SizeGuide, title: "Size guide" },
  "shipping-returns": { page: ShippingReturns, title: "Shipping and returns" },
  contact: { page: Contact, title: "Contact" },
  faq: { page: Faq, title: "FAQ" },
} as const satisfies Record<string, { page: ComponentType; title: string }>

type Route = keyof typeof PAGES | "home" | "notfound"

/**
 * `#/name...` is a page, `#/` or empty is home, and any other `#/…` is a 404.
 * Everything without a leading slash (`#lookbook`) is an in-page anchor,
 * reported as null.
 */
function routeFromHash(hash: string): Route | null {
  if (hash === "" || hash === "#" || hash === "#/") return "home"
  if (!hash.startsWith("#/")) return null
  const segment = hash.slice(2).split(/[/?]/)[0]
  if (segment === "") return "home"
  return segment in PAGES ? (segment as keyof typeof PAGES) : "notfound"
}

/**
 * Minimal hash router. Plain `#section` links still scroll in place; if the
 * section lives on the home page we switch to it first, then scroll.
 */
function useRoute() {
  const [route, setRoute] = useState<Route>(
    () => routeFromHash(window.location.hash) ?? "home",
  )
  const pendingAnchor = useRef<string | null>(null)
  const previous = useRef<Route>(route)

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash
      const next = routeFromHash(hash)
      if (next) return setRoute(next)
      const id = decodeURIComponent(hash.slice(1))
      if (id === "main" || document.getElementById(id)) return
      pendingAnchor.current = id
      setRoute("home")
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    if (previous.current === route) return
    previous.current = route
    const anchor = pendingAnchor.current
    pendingAnchor.current = null
    const target = anchor ? document.getElementById(anchor) : null
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" })
    else window.scrollTo({ top: 0, behavior: "instant" })
  }, [route])

  return route
}

const homeTitle = document.title

/** Routes that are public (no auth required) */
const PUBLIC_ROUTES: Route[] = [
  "home",
  "shop",
  "cart",
  "lookbook",
  "about",
  "contact",
  "faq",
  "shipping-returns",
  "size-guide",
  "notfound",
]

/** Routes that require authentication */
const PROTECTED_ROUTES: Route[] = [
  "checkout",
  "order",
  "account",
  "wishlist",
]

export default function App({ user }: { user: User | null }) {
  const hashRoute = useRoute()
  const lang = useLang()
  // Determine the effective route:
  // - If user is signed in, allow all routes
  // - If not signed in, only allow PUBLIC_ROUTES; redirect others to login with next param
  const isPublicRoute = PUBLIC_ROUTES.includes(hashRoute)
  const isProtectedRoute = PROTECTED_ROUTES.includes(hashRoute)
  const isAuthRoute = hashRoute === "login" || hashRoute === "register" || hashRoute === "forgot"

  let route: Route
  if (user || isAuthRoute || isPublicRoute) {
    route = hashRoute
  } else if (isProtectedRoute) {
    // Redirect to login with next parameter to return after auth
    window.location.hash = `#/login?next=${encodeURIComponent(`#/${hashRoute}`)}`
    route = "login"
  } else {
    route = "notfound"
  }

  useEffect(() => {
    document.title =
      route === "home"
        ? t(homeTitle)
        : route === "notfound"
          ? `${t("Page not found")} — Tengu`
          : `${tr(PAGES[route].title)} — Tengu`
  }, [route, lang])

  const Page: ComponentType =
    route === "home" ? Home : route === "notfound" ? NotFound : PAGES[route].page

  return (
    <AuthProvider initialUser={user}>
      <WishlistProvider>
        <CartProvider>
          {/* Remount on language change so every string re-reads the dictionary. */}
          <Fragment key={lang}>
            <Page />
          </Fragment>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
