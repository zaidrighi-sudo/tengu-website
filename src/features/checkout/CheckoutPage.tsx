import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { placeOrder as placeOrderOnServer } from "@/features/orders/backend"
import { AddressFields } from "@/features/checkout/AddressFields"
import { CheckoutShell } from "@/features/checkout/CheckoutShell"
import { OrderSummary } from "@/features/checkout/OrderSummary"
import { Progress, stepHash } from "@/features/checkout/Progress"
import { Icon } from "@/store/components/Icon"
import { TrustBadges } from "@/features/shell/TrustBadges"
import { FREE_SHIPPING_THRESHOLD, LOYALTY_FREE_DELIVERY_THRESHOLD } from "@/features/site-settings/navigation"
import { useAuth } from "@/features/auth/AuthContext"
import { useCart } from "@/features/cart/CartContext"
import {
  type Address,
  type CheckoutValues,
  SHIPPING_METHODS,
  STEPS,
  type StepId,
  addressLine,
  clearDraft,
  computeTotals,
  deliveryWindow,
  loadDraft,
  loyaltyFreeHomeApplies,
  maxDeliveryDays,
  normalizePhone,
  saveDraft,
  saveOrder,
  shippingCost,
  shippingMethod,
  validateStep,
} from "@/features/checkout/utils"
import { cn } from "@/shared/utils/cn"
import { formatMoney } from "@/shared/utils/format"
import { imagesForColor } from "@/features/products/variants"
import { t, tr } from "@/shared/i18n"

const stepFromHash = (hash: string): StepId => {
  const match = /step=(information|shipping|payment)/.exec(hash)
  return (match?.[1] as StepId | undefined) ?? "information"
}

export default function Checkout() {
  const { lines, subtotal, note, clear } = useCart()
  const [draft] = useState(loadDraft)
  const { user, refreshSession } = useAuth()
  // Signed-in shoppers start with their email and default address filled in.
  const [values, setValues] = useState<CheckoutValues>(() => {
    const saved = draft.values
    if (!user || saved.shipping.address1) return saved
    const home = user.addresses.find((a) => a.isDefault) ?? user.addresses[0]
    return {
      ...saved,
      shipping: home
        ? {
            country: "DZ",
            firstName: home.firstName,
            lastName: home.lastName,
            address1: home.address1,
            address2: home.address2,
            city: home.city,
            region: home.region,
            postal: "",
            phone: home.phone,
          }
        : {
            ...saved.shipping,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          },
    }
  })
  const [completed, setCompleted] = useState<StepId[]>(draft.completed)
  const [hashStep, setHashStep] = useState(() =>
    stepFromHash(window.location.hash),
  )
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [attempted, setAttempted] = useState(false)
  const [status, setStatus] = useState<"idle" | "processing" | "placed">("idle")
  const [serverError, setServerError] = useState("")
  const serverAlert = useRef<HTMLDivElement>(null)

  const main = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // A step is reachable once the one before it is complete.
  const step: StepId = useMemo(() => {
    const index = STEPS.findIndex((candidate) => candidate.id === hashStep)
    for (let i = 0; i < index; i++) {
      if (!completed.includes(STEPS[i].id)) return STEPS[i].id
    }
    return hashStep
  }, [hashStep, completed])

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith("#/checkout"))
        setHashStep(stepFromHash(window.location.hash))
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // Bounce direct visits to a later step back to the first unfinished one.
  useEffect(() => {
    if (step !== hashStep && status === "idle") {
      window.history.replaceState(null, "", stepHash(step))
      setHashStep(step)
    }
  }, [step, hashStep, status])

  useEffect(() => saveDraft({ values, completed }), [values, completed])

  // New step: reset touched state, move focus to its heading, show the top.
  const firstRender = useRef(true)
  useEffect(() => {
    setTouched({})
    setAttempted(false)
    setServerError("")
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    main.current?.scrollIntoView({ behavior: "instant", block: "start" })
    heading.current?.focus({ preventScroll: true })
  }, [step])

  const update = useCallback(
    (patch: Partial<CheckoutValues>) =>
      setValues((current) => ({ ...current, ...patch })),
    [],
  )
  const updateAddress = (patch: Partial<Address>) =>
    setValues((current) => ({
      ...current,
      shipping: { ...current.shipping, ...patch },
    }))

  const errors = validateStep(step, values)
  const errorFor = (id: string) =>
    attempted || touched[id] ? (errors[id] ?? "") : ""
  const touch = (id: string) =>
    setTouched((current) => (current[id] ? current : { ...current, [id]: true }))
  const errorCount = Object.keys(errors).length

  const go = (next: StepId) => {
    window.location.hash = stepHash(next)
  }

  /** Validate the step; on failure reveal errors and focus the first one. */
  const check = () => {
    if (errorCount === 0) return true
    setAttempted(true)
    requestAnimationFrame(() => {
      const first = main.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      )
      first?.focus()
    })
    return false
  }

  const advance = (event: FormEvent) => {
    event.preventDefault()
    if (!check()) return
    const index = STEPS.findIndex((candidate) => candidate.id === step)
    setCompleted((current) => [...new Set([...current, step])])
    go(STEPS[index + 1].id)
  }

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault()
    if (status !== "idle" || !check()) return
    setStatus("processing")
    setServerError("")
    const result = await placeOrderOnServer({
      lines: lines.map(({ product, size, color, qty }) => ({ productId: product.id, size, color, qty })),
      firstName: values.shipping.firstName,
      lastName: values.shipping.lastName,
      phone: values.shipping.phone,
      wilaya: values.shipping.region,
      commune: values.shipping.city,
      address1: values.shipping.address1,
      address2: values.shipping.address2,
      method: values.method,
      note,
    })
    if (!mounted.current) return
    if (!result.ok) {
      setStatus("idle")
      setServerError(result.error)
      requestAnimationFrame(() => serverAlert.current?.focus())
      return
    }

    // The server priced the order; keep a local copy for the confirmation page and account.
    const { shipping: address } = values
    const placedOrder = result.order
    const order = {
      number: placedOrder.number,
      placedAt: placedOrder.placedAt,
      email: user?.email ?? "",
      lines: lines.map(({ product, size, color, qty }) => ({
        id: product.id,
        name: product.name,
        color,
        size,
        qty,
        price:
          placedOrder.lines.find((line) => line.id === product.id)?.price ??
          product.price,
        image: imagesForColor(product, color)[0]?.url || product.image,
      })),
      note,
      subtotal: placedOrder.subtotal,
      shipping: placedOrder.shipping,
      tax: 0,
      total: placedOrder.total,
      methodLabel: shippingMethod(values.method).label,
      delivery: deliveryWindow(address.region),
      maxDays: maxDeliveryDays(address.region),
      address: { ...address, phone: normalizePhone(address.phone) },
      payment: "cod" as const,
    }
    saveOrder(order)
    clearDraft()
    // The server recomputed the lifetime delivered spend; sync the account.
    void refreshSession()
    setStatus("placed")
    clear()
    window.location.hash = `#/order/${order.number}`
  }

  /* ---------- Empty bag ---------- */
  if (lines.length === 0 && status !== "placed") {
    return (
      <CheckoutShell>
        <div className="co-empty">
          <h1>{t("Your bag is empty")}</h1>
          <p>{t("Add something from the drop before you order.")}</p>
          <a className="btn btn-solid" href="#/shop">
            {t("Shop the drop")} <Icon name="arrow" />
          </a>
        </div>
      </CheckoutShell>
    )
  }

  const lifetimeSpent = user?.lifetimeSpent ?? 0
  const totals = computeTotals(subtotal, values.method, values.shipping.region, values.shipping.city, lifetimeSpent)
  const method = shippingMethod(values.method)
  // The fee depends on the wilaya: pending until step one is done.
  const pending = !completed.includes("information")

  // Loyalty reward is the free home delivery (applied in totals.shipping); there is no points discount.
  const shipping = pending ? 0 : totals.shipping
  const total = subtotal + shipping

  const index = STEPS.findIndex((candidate) => candidate.id === step)

  const shownErrors = Object.entries(errors).filter(
    ([id]) => attempted || touched[id],
  )

  return (
    <CheckoutShell>
      <h1 className="sr-only">{t("Checkout")}</h1>
      <div className="co">
        <OrderSummary totals={totals} pending={pending} />

        <div className="co-main" ref={main}>
          <Progress current={step} completed={completed} />

          <form
            key={step}
            className="co-form"
            noValidate
            onSubmit={step === "payment" ? placeOrder : advance}
            aria-busy={status === "processing"}
          >
            {attempted && errorCount > 0 && (
              <div className="co-alert" role="alert">
                <Icon name="alert" />
                <div>
                  <strong>
                    {errorCount === 1
                      ? t("One thing needs your attention")
                      : t("{errorCount} things need your attention", { errorCount: errorCount })}
                  </strong>
                  <ul>
                    {shownErrors.map(([id, message]) => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          onClick={(event) => {
                            event.preventDefault()
                            document.getElementById(id)?.focus()
                          }}
                        >
                          {tr(message)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {serverError && (
              <div className="co-alert" role="alert" tabIndex={-1} ref={serverAlert}>
                <Icon name="alert" />
                <div>
                  <strong>{t("Your order was not placed")}</strong>
                  <p>{tr(serverError)}</p>
                  <p>
                    <a href={stepHash("information")}>{t("Check your details")}</a>
                  </p>
                </div>
              </div>
            )}

            {step === "information" && (
              <>
                <h2 ref={heading} tabIndex={-1} className="co-title">
                  {t("Your details")}
                </h2>
                <fieldset className="co-section">
                  <legend>{t("Delivery address")}</legend>
                  <AddressFields
                    prefix="ship"
                    section="shipping"
                    value={values.shipping}
                    onChange={updateAddress}
                    errorFor={errorFor}
                    onBlurField={touch}
                  />
                </fieldset>
              </>
            )}

            {step === "shipping" && (
              <>
                <h2 ref={heading} tabIndex={-1} className="co-title">
                  {t("Delivery method")}
                </h2>
                <Review
                  rows={[
                    {
                      label: "Contact",
                      value: `${values.shipping.firstName} ${values.shipping.lastName}, ${values.shipping.phone}`,
                    },
                    { label: "Deliver to", value: addressLine(values.shipping) },
                  ]}
                  onChange={() => go("information")}
                />
                <fieldset className="co-section">
                  <legend className="sr-only">{t("Choose a delivery method")}</legend>
                  <div className="co-methods">
                    {SHIPPING_METHODS.map((option) => {
                      const cost = shippingCost(
                        option.id,
                        subtotal,
                        values.shipping.region,
                        values.shipping.city,
                        lifetimeSpent,
                      )
                      const checked = values.method === option.id
                      return (
                        <label
                          key={option.id}
                          className={cn("co-method", checked && "is-checked")}
                        >
                          <input
                            type="radio"
                            name="method"
                            value={option.id}
                            checked={checked}
                            onChange={() => update({ method: option.id })}
                          />
                          <span className="co-radio" aria-hidden="true" />
                          <span className="co-method-text">
                            <strong>{tr(option.label)}</strong>
                            <span>
                              {t("{note}. Arrives in {delivery}", {
                                note: tr(option.note),
                                delivery: deliveryWindow(values.shipping.region),
                              })}
                            </span>
                          </span>
                          <span className="co-method-price">
                            {cost === 0 ? t("Free") : formatMoney(cost ?? 0)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="field-hint">
                    {t("Delivered by dhd to all 58 wilayas. Home delivery is free over {price}.", { price: formatMoney(FREE_SHIPPING_THRESHOLD) })}
                  </p>
                  {user && LOYALTY_FREE_DELIVERY_THRESHOLD > 0 &&
                    (loyaltyFreeHomeApplies(lifetimeSpent) ? (
                      <p className="field-hint co-loyalty-hint is-unlocked">
                        <Icon name="check" />
                        {t("Loyalty unlocked: home delivery is free on this order.")}
                      </p>
                    ) : (
                      <p className="field-hint co-loyalty-hint">
                        {t("Spend {amount} more on delivered orders for free home delivery forever.", {
                          amount: formatMoney(LOYALTY_FREE_DELIVERY_THRESHOLD - lifetimeSpent),
                        })}
                      </p>
                    ))}
                </fieldset>
              </>
            )}

            {step === "payment" && (
              <>
                <h2 ref={heading} tabIndex={-1} className="co-title">
                  {t("Confirm your order")}
                </h2>
                <Review
                  rows={[
                    {
                      label: "Contact",
                      value: `${values.shipping.firstName} ${values.shipping.lastName}, ${values.shipping.phone}`,
                    },
                    { label: "Deliver to", value: addressLine(values.shipping) },
                    {
                      label: "Method",
                      value: t("{method}, arrives in {delivery}", {
                        method: tr(method.label),
                        delivery: deliveryWindow(values.shipping.region),
                      }),
                      action: () => go("shipping"),
                    },
                  ]}
                  onChange={() => go("information")}
                />

                <fieldset className="co-section">
                  <legend>{t("Payment")}</legend>
                  <div className="co-methods">
                    <label className="co-method is-checked">
                      <input type="radio" name="payment" checked readOnly />
                      <span className="co-radio" aria-hidden="true" />
                      <span className="co-method-text">
                        <strong>{t("Cash on delivery")}</strong>
                        <span>
                          {t("Pay the courier in cash when your parcel arrives. Check it first, then pay.")}
                        </span>
                      </span>
                      <span className="co-method-price">
                        <Icon name="cash" />
                      </span>
                    </label>
                  </div>

                  <p className="co-demo">
                    <Icon name="phone" />
                    <span>
                      {t("We call {phone} to confirm before your order ships.", { phone: values.shipping.phone })}
                    </span>
                  </p>
                </fieldset>
              </>
            )}

            <div className="co-actions">
              {step === "information" ? (
                <a className="co-link" href="#/cart">
                  <Icon name="arrow" /> {t("Return to bag")}
                </a>
              ) : (
                <a
                  className="co-link"
                  href={stepHash(STEPS[index - 1].id)}
                >
                  <Icon name="arrow" /> {t("Back to {step}", { step: tr(STEPS[index - 1].label).toLowerCase() })}
                </a>
              )}
              <button
                type="submit"
                className="btn btn-solid btn-lg co-submit"
                disabled={status !== "idle"}
              >
                {step === "payment" ? (
                  status === "idle" ? (
                    <>
                      <span className="co-submit-label">
                        <Icon name="cash" /> {t("Confirm order, pay")} {formatMoney(total)}
                      </span>
                      <Icon name="arrow" />
                    </>
                  ) : (
                    <>
                      <span role="status">{t("Placing your orderâ€¦")}</span>
                      <span className="co-spinner" aria-hidden="true" />
                    </>
                  )
                ) : (
                  <>
                    {t("Continue to {step}", { step: tr(STEPS[index + 1].label).toLowerCase() })}
                    <Icon name="arrow" />
                  </>
                )}
              </button>
            </div>

            {step === "payment" && (
              <p className="co-terms">
                {t("By confirming you agree to our terms of sale and exchange policy. You pay only when the parcel is in your hands.")}
              </p>
            )}
          </form>

          <TrustBadges layout="row" className="co-trust" />
        </div>
      </div>
    </CheckoutShell>
  )
}

/** Compact recap of earlier steps, each row with a way to change it. */
function Review({
  rows,
  onChange,
}: {
  rows: { label: string; value: string; action?: () => void }[]
  onChange: () => void
}): ReactNode {
  return (
    <dl className="co-review">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{tr(row.label)}</dt>
          <dd>{tr(row.value)}</dd>
          <dd>
            <button type="button" onClick={row.action ?? onChange}>
              {t("Change")}<span className="sr-only"> {tr(row.label).toLowerCase()}</span>
            </button>
          </dd>
        </div>
      ))}
    </dl>
  )
}
