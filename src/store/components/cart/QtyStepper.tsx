import { type KeyboardEvent, useEffect, useState } from "react"
import { MAX_QTY } from "@/store/context/CartContext"
import { t } from "@/store/i18n"

/**
 * Quantity control with +/- buttons and a typeable value. Typing is committed
 * on blur or Enter; anything that is not 1-9 snaps back to the current value.
 */
export function QtyStepper({
  name,
  qty,
  onChange,
  max = MAX_QTY,
}: {
  name: string
  qty: number
  onChange: (qty: number) => void
  /** Upper limit for this line, usually the stock left for the variant. */
  max?: number
}) {
  const [draft, setDraft] = useState(String(qty))
  useEffect(() => setDraft(String(qty)), [qty])

  const commit = () => {
    const next = Number.parseInt(draft, 10)
    if (Number.isNaN(next) || next < 1) return setDraft(String(qty))
    const clamped = Math.min(max, next)
    setDraft(String(clamped))
    if (clamped !== qty) onChange(clamped)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      commit()
    }
  }

  return (
    <div className="qty" role="group" aria-label={t("Quantity for {name}", { name: name })}>
      <button
        type="button"
        aria-label={t("Decrease quantity of {name}", { name: name })}
        onClick={() => onChange(qty - 1)}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={t("Quantity of {name}", { name: name })}
        value={draft}
        maxLength={1}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        aria-label={t("Increase quantity of {name}", { name: name })}
        onClick={() => onChange(qty + 1)}
        disabled={qty >= max}
      >
        +
      </button>
    </div>
  )
}
