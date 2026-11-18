import { STEPS, type StepId } from "@/features/checkout/utils"
import { cn } from "@/shared/utils/cn"
import { Icon } from "@/shared/components/Icon"
import { t, tr } from "@/shared/i18n"

export const stepHash = (step: StepId) =>
  step === "information" ? "#/checkout" : `#/checkout?step=${step}`

/** Numbered progress. Finished steps are links back to them. */
export function Progress({
  current,
  completed,
}: {
  current: StepId
  completed: StepId[]
}) {
  const index = STEPS.findIndex((step) => step.id === current)

  return (
    <nav className="co-progress" aria-label={t("Checkout progress")}>
      <p className="co-progress-count label" aria-hidden="true">
        {t("Step")} {index + 1} {t("of")} {STEPS.length}
      </p>
      <ol className="co-steps">
        {STEPS.map((step, position) => {
          const done = completed.includes(step.id) && step.id !== current
          const state = step.id === current ? "current" : done ? "done" : "todo"
          const inner = (
            <>
              <span className="co-step-n" aria-hidden="true">
                {done ? <Icon name="check" /> : position + 1}
              </span>
              <span className="co-step-label">{tr(step.label)}</span>
              {done && <span className="sr-only"> {t("(completed)")}</span>}
            </>
          )
          return (
            <li
              key={step.id}
              className={cn("co-step", `is-${state}`)}
              aria-current={state === "current" ? "step" : undefined}
            >
              {done ? <a href={stepHash(step.id)}>{tr(inner)}</a> : <span>{tr(inner)}</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
