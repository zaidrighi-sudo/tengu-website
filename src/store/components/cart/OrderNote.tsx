import { useEffect, useState } from "react"
import { MAX_NOTE, useCart } from "@/store/context/CartContext"
import { Icon } from "../Icon"
import { t, tr } from "@/store/i18n"

/** Order note. Collapsible in the drawer, always open on the cart page. */
export function OrderNote({
  id,
  collapsible = false,
}: {
  id: string
  collapsible?: boolean
}) {
  const { note, setNote } = useCart()
  const [open, setOpen] = useState(note.length > 0)

  // A note written elsewhere (cart page) must be visible here. Clearing the
  // text never collapses the panel, so it cannot jump away mid-edit.
  useEffect(() => {
    if (note.length > 0) setOpen(true)
  }, [note])

  const field = (
    <>
      <label
        className={collapsible ? "sr-only" : "field-label"}
        htmlFor={id}
      >
        {t("Order note")} <span className="field-optional">{t("(optional)")}</span>
      </label>
      <textarea
        id={id}
        rows={3}
        maxLength={MAX_NOTE}
        autoComplete="off"
        placeholder={t("Gift message, delivery instructions…")}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        aria-describedby={`${id}-count`}
      />
      <p id={`${id}-count`} className="field-hint">
        {note.length}/{tr(MAX_NOTE)}
      </p>
    </>
  )

  if (!collapsible) return <div className="order-note">{tr(field)}</div>

  return (
    <details
      className="order-note cart-note"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        {t("Add an order note")}
        <Icon name="chevron" />
      </summary>
      {tr(field)}
    </details>
  )
}
