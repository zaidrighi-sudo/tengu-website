import { unsplash as U } from "@/shared/utils/images"

export type NavLink = {
  label: string
  href: string
  mega?: boolean
}

/** A CMS category as far as the navigation bar cares. */
export type NavCategory = { name: string; showInNav?: boolean }

// Dynamic primaryLinks generated from CMS categories with showInNav === true.
// Populated by `hydrateStore`; starts empty so nothing renders before hydration.
export const primaryLinks: NavLink[] = []

/**
 * Build the primary navigation from CMS categories flagged showInNav.
 * Falls back to the storefront's default links while the CMS has no categories.
 */
export function buildPrimaryLinks(categories: NavCategory[]): NavLink[] {
  // No categories in the CMS yet: keep the storefront's default links.
  if (categories.length === 0) {
    return [
      { label: "Shop", href: "#/shop", mega: true },
      { label: "New Drop", href: "#/shop?new=1" },
      { label: "Sale", href: "#/shop?sale=1" },
      { label: "Lookbook", href: "#/lookbook" },
      { label: "About", href: "#/about" },
    ]
  }

  // Once the CMS has categories, the nav shows exactly those flagged for it.
  return categories
    .filter((category) => category.showInNav !== false)
    .map((category) => ({
      label: category.name,
      href: `#/shop?category=${encodeURIComponent(category.name)}`,
    }))
}

/** Replace `primaryLinks` in place. Called from `hydrateStore`. */
export function setPrimaryLinks(categories: NavCategory[]): void {
  primaryLinks.splice(0, primaryLinks.length, ...buildPrimaryLinks(categories))
}

export const megaLinks = [
  { label: "Shop all", href: "#/shop" },
  { label: "New drop", href: "#/shop?new=1" },
  { label: "Sale", href: "#/shop?sale=1" },
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Joggers", href: "#/shop?category=Joggers" },
  { label: "Outerwear", href: "#/shop?category=Outerwear" },
]

export const megaCards = [
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
    note: "AW25 â€” just landed",
    href: "#/shop?new=1",
    image: U("1614214191247-5b2d3a734f1b", 700),
  },
]

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
