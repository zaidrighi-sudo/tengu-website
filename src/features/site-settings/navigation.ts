import { unsplash as U } from "@/shared/utils/images"

export type NavLink = {
  label: string
  href: string
  mega?: boolean
}

/** A CMS category as far as the navigation bar cares. */
export type NavCategory = {
  id?: string
  name: string
  showInNav?: boolean
  /** Banner/tile image URL used by the shop mega-menu cards. */
  tileImage?: string
  /** Short description shown under a mega-menu card title. */
  tileAlt?: string
}

const categoryHref = (name: string) =>
  `#/shop?category=${encodeURIComponent(name)}`

// Dynamic primaryLinks generated from CMS categories with showInNav === true.
// Populated by `hydrateStore`; starts empty so nothing renders before hydration.
export const primaryLinks: NavLink[] = []

/** Fallback top nav used while the CMS has no categories. */
const defaultPrimaryLinks: NavLink[] = [
  { label: "Shop", href: "#/shop", mega: true },
  { label: "New Drop", href: "#/shop?new=1" },
  { label: "Sale", href: "#/shop?sale=1" },
  { label: "Lookbook", href: "#/lookbook" },
  { label: "About", href: "#/about" },
]

/**
 * Build the primary navigation from CMS categories flagged showInNav.
 * Falls back to the storefront's default links while the CMS has no categories.
 * The "Shop" entry always stays first so the mega menu remains reachable.
 */
export function buildPrimaryLinks(categories: NavCategory[]): NavLink[] {
  // No categories in the CMS yet: keep the storefront's default links.
  if (categories.length === 0) return [...defaultPrimaryLinks]

  // With categories, "Shop" opens the mega menu and the flagged categories
  // follow as direct links. Lookbook/About stay reachable.
  return [
    { label: "Shop", href: "#/shop", mega: true },
    ...categories
      .filter((category) => category.showInNav !== false)
      .map((category) => ({
        label: category.name,
        href: categoryHref(category.name),
      })),
    { label: "Lookbook", href: "#/lookbook" },
    { label: "About", href: "#/about" },
  ]
}

/** Replace `primaryLinks` in place. Called from `hydrateStore`. */
export function setPrimaryLinks(categories: NavCategory[]): void {
  primaryLinks.splice(0, primaryLinks.length, ...buildPrimaryLinks(categories))
}

/** Footer "Shop" column links, built from the same CMS categories. */
export const footerShopLinks: NavLink[] = []

/** Fallback footer "Shop" column while the CMS has no categories. */
const defaultFooterShopLinks: NavLink[] = [
  { label: "New in", href: "#/shop?new=1" },
  { label: "Sale", href: "#/shop?sale=1" },
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Joggers", href: "#/shop?category=Joggers" },
  { label: "Outerwear", href: "#/shop?category=Outerwear" },
  { label: "Tees", href: "#/shop?category=Tees" },
  { label: "Accessories", href: "#/shop?category=Accessories" },
]

export function buildFooterShopLinks(categories: NavCategory[]): NavLink[] {
  const visible = categories.filter((category) => category.showInNav !== false)
  if (visible.length === 0) return [...defaultFooterShopLinks]
  return visible.map((category) => ({
    label: category.name,
    href: categoryHref(category.name),
  }))
}

/** Replace `footerShopLinks` in place. Called from `hydrateStore`. */
export function setFooterShopLinks(categories: NavCategory[]): void {
  footerShopLinks.splice(0, footerShopLinks.length, ...buildFooterShopLinks(categories))
}

/** One image card in the shop mega menu. */
export type MegaCard = {
  label: string
  note?: string
  href: string
  image: string
}

/** Fallback mega-menu quick links used while the CMS has no categories. */
const defaultMegaLinks: NavLink[] = [
  { label: "Shop all", href: "#/shop" },
  { label: "New drop", href: "#/shop?new=1" },
  { label: "Sale", href: "#/shop?sale=1" },
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Joggers", href: "#/shop?category=Joggers" },
  { label: "Outerwear", href: "#/shop?category=Outerwear" },
]

/** Fallback mega-menu image cards used while the CMS has no categories. */
const defaultMegaCards: MegaCard[] = [
  {
    label: "Hoodies",
    note: "Heavyweight fleece",
    href: "#/shop?category=Hoodies",
    image: U("1616257892423-861f4e77bd48", 700),
  },
  {
    label: "Joggers",
    note: "Cut for movement",
    href: "#/shop?category=Joggers",
    image: U("1618924250113-e162305ac8cd", 700),
  },
  {
    label: "Outerwear",
    note: "After-dark layers",
    href: "#/shop?category=Outerwear",
    image: U("1579883180654-695b7f038d4c", 700),
  },
  {
    label: "New Drop",
    note: "AW25 — just landed",
    href: "#/shop?new=1",
    image: U("1614214191247-5b2d3a734f1b", 700),
  },
]

/** Mega-menu quick links, rebuilt from CMS categories by `hydrateStore`. */
export const megaLinks: NavLink[] = [...defaultMegaLinks]

/** Mega-menu image cards, rebuilt from CMS categories by `hydrateStore`. */
export const megaCards: MegaCard[] = [...defaultMegaCards]

/**
 * Build the shop mega menu from CMS categories: quick links plus one image
 * card per category that has a tile image. When the admin curated a subset in
 * Site Settings, exactly those categories (and their order) are shown.
 * Falls back to the default menu while the CMS has no categories.
 */
export function setMegaMenu(
  categories: NavCategory[],
  selectedIds?: string[],
): void {
  const visible = categories.filter((category) => category.showInNav !== false)

  if (visible.length === 0) {
    megaLinks.splice(0, megaLinks.length, ...defaultMegaLinks)
    megaCards.splice(0, megaCards.length, ...defaultMegaCards)
    return
  }

  // A curated selection wins over the "all categories" default. Matching is by
  // id so renamed categories keep working; unknown ids are ignored.
  const picked = (selectedIds ?? [])
    .map((id) => categories.find((category) => category.id === id))
    .filter((category): category is NavCategory => Boolean(category))
  const shown = picked.length > 0 ? picked : visible

  megaLinks.splice(
    0,
    megaLinks.length,
    { label: "Shop all", href: "#/shop" },
    { label: "New drop", href: "#/shop?new=1" },
    { label: "Sale", href: "#/shop?sale=1" },
    ...shown.map((category) => ({
      label: category.name,
      href: categoryHref(category.name),
    })),
  )

  // Only categories with an uploaded tile image can fill an image card.
  const cards: MegaCard[] = shown
    .filter((category) => category.tileImage)
    .map((category) => ({
      label: category.name,
      note: category.tileAlt || undefined,
      href: categoryHref(category.name),
      image: category.tileImage as string,
    }))
  megaCards.splice(0, megaCards.length, ...cards)
}

export const searchSuggestions = [
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Joggers", href: "#/shop?category=Joggers" },
  { label: "Outerwear", href: "#/shop?category=Outerwear" },
  { label: "Tees", href: "#/shop?category=Tees" },
  { label: "New in", href: "#/shop?new=1" },
]

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "New in", href: "#/shop?new=1" },
      { label: "Sale", href: "#/shop?sale=1" },
      { label: "Hoodies", href: "#/shop?category=Hoodies" },
      { label: "Joggers", href: "#/shop?category=Joggers" },
      { label: "Outerwear", href: "#/shop?category=Outerwear" },
      { label: "Tees", href: "#/shop?category=Tees" },
      { label: "Accessories", href: "#/shop?category=Accessories" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery", href: "#/shipping-returns" },
      { label: "Exchange", href: "#/shipping-returns" },
      { label: "Size guide", href: "#/size-guide" },
      { label: "FAQ", href: "#/faq" },
      { label: "Contact", href: "#/contact" },
    ],
  },
  {
    title: "Tengu",
    links: [
      { label: "The legend", href: "#/about" },
      { label: "Lookbook", href: "#/lookbook" },
      { label: "Account", href: "#/account" },
      { label: "Wishlist", href: "#/wishlist" },
    ],
  },
]

export const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/tengu_clthng/",
    icon: "instagram" as const,
  },
]

/** Free home delivery from this subtotal (DA). Set from the CMS by `hydrateStore`. */
export let FREE_SHIPPING_THRESHOLD = 15000
export const setFreeShippingThreshold = (value: number) => {
  FREE_SHIPPING_THRESHOLD = value
}

/** Lifetime delivered spend (DA) that unlocks free home delivery. Set from the CMS by `hydrateStore`. 0 disables. */
export let LOYALTY_FREE_DELIVERY_THRESHOLD = 15000
export const setLoyaltyFreeDeliveryThreshold = (value: number) => {
  LOYALTY_FREE_DELIVERY_THRESHOLD = value
}
