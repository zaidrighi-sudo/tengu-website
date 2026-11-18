import type { Order } from "@/features/checkout/utils"
import { cn } from "@/shared/utils/cn"
import { trackingFor } from "@/features/account/tracking"
import { Icon } from "@/shared/components/Icon"
import { t, tr, dateFormatter } from "@/shared/i18n"

const when = dateFormatter({
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})
const day = dateFormatter({
  weekday: "short",
  month: "short",
  day: "numeric",
})

/** Five-step delivery timeline. Reached steps show a time, the rest an estimate. */
export function OrderTimeline({ order }: { order: Order }) {
  const { steps, delivered } = trackingFor(order)

  return (
    <ol className="timeline" aria-label={t("Tracking for order {number}", { number: order.number })}>
      {steps.map((step) => {
        const done = step.state === "done" || (step.state === "current" && delivered)
        return (
          <li
            key={step.id}
            className={cn("tl-step", `is-${step.state}`, done && "is-done")}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="tl-marker" aria-hidden="true">
              {done ? <Icon name="check" /> : <span className="tl-dot" />}
            </span>
            <div className="tl-body">
              <h4>{tr(step.label)}</h4>
              <p className="tl-time">
                {step.state === "upcoming" ? t("Estimated {date}", { date: day.format(step.at) }) : when.format(step.at)}
              </p>
              {step.state !== "upcoming" && <p className="tl-detail">{tr(step.detail)}</p>}
              <span className="sr-only">
                {step.state === "upcoming" ? t("Upcoming") : step.state === "current" && !delivered ? t("Current step") : t("Completed")}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
