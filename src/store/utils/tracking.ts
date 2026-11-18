import type { Order } from "./checkout"
import { t } from "@/store/i18n"

export type TrackingStep = {
  id: "placed" | "packed" | "shipped" | "out" | "delivered"
  label: string
  detail: string
  at: Date
  state: "done" | "current" | "upcoming"
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

/**
 * Demo tracking: progress is derived from the order time and the shipping
 * method, so a fresh order starts at "confirmed" and moves along by itself.
 */
export function trackingFor(order: Order, now = new Date()) {
  const placed = new Date(order.placedAt).getTime()
  const days = Math.max(2, order.maxDays ?? 4)

  const times = {
    placed,
    packed: placed + 18 * HOUR,
    shipped: placed + 30 * HOUR,
    out: placed + days * DAY - 3 * HOUR,
    delivered: placed + days * DAY + 3 * HOUR,
  }
  const trackingNumber = `TNG${order.number.replace(/\D/g, "")}DZ`

  const base: Omit<TrackingStep, "state" | "at">[] = [
    { id: "placed", label: "Order confirmed", detail: "We called to confirm and your order is locked in." },
    { id: "packed", label: "Packed", detail: "Checked, folded and boxed at the studio." },
    { id: "shipped", label: "Shipped", detail: t("Handed to dhd. Tracking {number}.", { number: trackingNumber }) },
    { id: "out", label: "Out for delivery", detail: t("On its way to {city}.", { city: order.address.city }) },
    { id: "delivered", label: "Delivered", detail: "Paid in cash to the courier. Enjoy it." },
  ]

  const reached = Math.max(
    1,
    base.filter((step) => now.getTime() >= times[step.id]).length,
  )
  const steps: TrackingStep[] = base.map((step, index) => ({
    ...step,
    at: new Date(times[step.id]),
    state:
      index < reached - 1 ? "done" : index === reached - 1 ? "current" : "upcoming",
  }))

  const current = steps.find((step) => step.state === "current") ?? steps[0]
  return {
    steps,
    current,
    delivered: reached === base.length,
    trackingNumber: reached >= 3 ? trackingNumber : null,
  }
}
