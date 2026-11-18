import { FREE_SHIPPING_THRESHOLD, LOYALTY_FREE_DELIVERY_THRESHOLD } from "@/store/data/navigation"
import { ZONES, wilayaByName, wilayaDisplay } from "@/store/data/algeria"
import { communeFee } from "@/store/data/communes"
import { t } from "@/store/i18n"

/* ---------- Steps ---------- */

export type StepId = "information" | "shipping" | "payment"

export const STEPS: { id: StepId; label: string }[] = [
  { id: "information", label: "Information" },
  { id: "shipping", label: "Delivery" },
  { id: "payment", label: "Confirm" },
]

/* ---------- Form values ---------- */

/**
 * Algerian address. `region` holds the wilaya name and `city` the commune.
 * `country` is always DZ; `postal` is kept only so older saved data still fits.
 */
export type Address = {
  country: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  region: string
  postal: string
  phone: string
}

export type CheckoutValues = {
  email: string
  marketing: boolean
  shipping: Address
  method: ShippingId
}

export const emptyAddress = (): Address => ({
  country: "DZ",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postal: "",
  phone: "",
})

export const initialValues = (): CheckoutValues => ({
  email: "",
  marketing: false,
  shipping: emptyAddress(),
  method: "home",
})

/** Field ids double as error keys: `ship-phone`, `ship-region`, ... */
export type Errors = Record<string, string>

/** `Rue 12, Bab Ezzouar, Alger` */
export const addressLine = (address: Address) =>
  [address.address1, address.address2, address.city, wilayaDisplay(address.region)]
    .filter(Boolean)
    .join(", ")

/* ---------- Validation ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string) {
  const email = value.trim()
  if (!email) return "Enter your email address."
  if (!EMAIL.test(email))
    return "Enter a valid email address, like name@example.com."
  return ""
}

/** Algerian mobile: 05 / 06 / 07 followed by 8 digits. +213 and 00213 accepted. */
export function normalizePhone(value: string) {
  const digits = value.replace(/[^\d]/g, "")
  if (digits.startsWith("00213")) return `0${digits.slice(5)}`
  if (digits.startsWith("213")) return `0${digits.slice(3)}`
  return digits
}

export const isMobile = (value: string) => /^0[567]\d{8}$/.test(normalizePhone(value))

/** Optional phone (profile page): blank is fine, otherwise it must be valid. */
export function validatePhone(value: string) {
  if (!value.trim()) return ""
  return isMobile(value)
    ? ""
    : "Enter a valid Algerian mobile number, like 0550 12 34 56, or leave this blank."
}

export function validateAddress(address: Address, prefix: string): Errors {
  const errors: Errors = {}
  const required = (key: keyof Address, message: string) => {
    if (!address[key].trim()) errors[`${prefix}-${key}`] = message
  }
  required("firstName", "Enter your first name.")
  required("lastName", "Enter your last name.")
  if (!address.phone.trim()) {
    errors[`${prefix}-phone`] = "Enter your phone number so the courier can reach you."
  } else if (!isMobile(address.phone)) {
    errors[`${prefix}-phone`] =
      "Enter a valid mobile number, like 0550 12 34 56."
  }
  required("region", "Select your wilaya.")
  required("city", "Enter your commune.")
  required("address1", "Enter your street address.")
  return errors
}

export function validateStep(step: StepId, values: CheckoutValues): Errors {
  if (step === "information") return validateAddress(values.shipping, "ship")
  return {}
}

/* ---------- Delivery and totals ---------- */

export type ShippingId = "home" | "desk"

export type ShippingMethod = {
  id: ShippingId
  label: string
  note: string
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "home", label: "Home delivery", note: "To your door" },
  { id: "desk", label: "Stop-desk pickup", note: "Collect at the carrier desk in your wilaya" },
]

export const shippingMethod = (id: ShippingId) =>
  SHIPPING_METHODS.find((method) => method.id === id) ?? SHIPPING_METHODS[0]

/** True when the loyalty lifetime-spend reward unlocks free home delivery. */
export function loyaltyFreeHomeApplies(lifetimeSpent: number) {
  return LOYALTY_FREE_DELIVERY_THRESHOLD > 0 && lifetimeSpent >= LOYALTY_FREE_DELIVERY_THRESHOLD
}

/** Fee in DA. `null` until a wilaya is chosen. A commune override wins over the zone price. Home delivery is free over the cart threshold or once the loyalty lifetime spend is reached. */
export function shippingCost(
  id: ShippingId,
  subtotal: number,
  wilaya: string,
  commune?: string,
  lifetimeSpent = 0,
): number | null {
  const found = wilayaByName(wilaya)
  if (!found) return null
  if (id === "home" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  if (id === "home" && loyaltyFreeHomeApplies(lifetimeSpent)) return 0
  const fee = commune ? communeFee(wilaya, commune) : null
  if (fee) return fee[id]
  const zoneFee = ZONES[found.zone]
  return zoneFee ? zoneFee[id] : null
}

export function computeTotals(subtotal: number, id: ShippingId, wilaya: string, commune?: string, lifetimeSpent = 0) {
  const shipping = shippingCost(id, subtotal, wilaya, commune, lifetimeSpent) ?? 0
  return { shipping, tax: 0, total: subtotal + shipping }
}

/** Days range for a wilaya, e.g. `2–3 days`. */
export function deliveryWindow(wilaya: string) {
  const found = wilayaByName(wilaya)
  if (!found) return ""
  const [min, max] = ZONES[found.zone]?.days ?? [2, 5]
  return min === max
    ? t(min === 1 ? "{n} day" : "{n} days", { n: min })
    : t("{min}–{max} days", { min, max })
}

export const maxDeliveryDays = (wilaya: string) => {
  const found = wilayaByName(wilaya)
  return found ? ZONES[found.zone]?.days[1] ?? 5 : 5
}

/* ---------- Draft (session) and orders (local) ---------- */

const DRAFT_KEY = "tengu-checkout"
const ORDERS_KEY = "tengu-orders"

type Draft = { values: CheckoutValues; completed: StepId[] }

export function saveDraft(draft: Draft) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* storage unavailable: the draft lives in memory only */
  }
}

export function loadDraft(): Draft {
  const base: Draft = { values: initialValues(), completed: [] }
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<Draft>
    const defaults = initialValues()
    return {
      values: {
        ...defaults,
        ...parsed.values,
        shipping: { ...defaults.shipping, ...parsed.values?.shipping },
      },
      completed: (parsed.completed ?? []).filter((id) =>
        STEPS.some((step) => step.id === id),
      ),
    }
  } catch {
    return base
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

export type Order = {
  number: string
  placedAt: string
  email: string
  lines: {
    id: string
    name: string
    color: string
    /** Missing on orders saved before sizes were chosen. */
    size?: string
    qty: number
    price: number
    image: string
  }[]
  note: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  methodLabel: string
  delivery: string
  /** Latest delivery estimate in days, drives the demo tracking. */
  maxDays?: number
  address: Address
  /** Payment is always cash on delivery. */
  payment?: "cod"
  /** Demo orders added from the account page. */
  sample?: boolean
}

export function loadOrders(): Order[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Order[]) : []
  } catch {
    return []
  }
}

function writeOrders(orders: Order[]) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    /* storage unavailable: confirmation falls back to a short message */
  }
}

/** Persist an order on this device (the database copy is written server-side too). */
export function saveOrder(order: Order) {
  writeOrders([order, ...loadOrders().filter((o) => o.number !== order.number)])
}

export function removeSampleOrders(email: string) {
  writeOrders(
    loadOrders().filter(
      (order) => !(order.sample && order.email.toLowerCase() === email.toLowerCase()),
    ),
  )
}

export function loadOrder(number: string): Order | null {
  return loadOrders().find((order) => order.number === number) ?? null
}
