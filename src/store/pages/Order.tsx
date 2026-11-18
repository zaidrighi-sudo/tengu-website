import { useEffect, useMemo, useRef, useState } from "react"
import { Hanko } from "@/store/components/Hanko"
import { Icon, type IconName } from "@/store/components/Icon"
import { Layout } from "@/store/components/Layout"
import { useAuth } from "@/store/context/AuthContext"
import { wilayaDisplay } from "@/store/data/algeria"
import { deliveryWindow, loadOrder } from "@/store/utils/checkout"
import { formatMoney } from "@/store/utils/format"
import { siteSettings } from "@/store/data/settings"
import { t, tr, dateFormatter } from "@/store/i18n"
import { StoreImage } from "@/store/components/StoreImage"

const numberFromHash = (hash: string) =>
  decodeURIComponent(/^#\/order\/([^?]+)/.exec(hash)?.[1] ?? "")

const placed = dateFormatter({
  dateStyle: "long",
  timeStyle: "short",
})

export default function Order() {
  // The route stays "order" across order URLs, so follow the hash.
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])
  const number = numberFromHash(hash)
  const order = useMemo(() => loadOrder(number), [number])
  const { user } = useAuth()
  const heading = useRef<HTMLHeadingElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [number])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the number is still on screen */
    }
  }

  if (!order) {
    return (
      <Layout overlayHeader={false}>
        <div className="order order-missing">
          <h1 ref={heading} tabIndex={-1} className="order-title">
            {t("Order not found")}
          </h1>
          <p>
            {t("We cannot find order {number} on this device. If you have just placed it, the confirmation page has every detail.", { number: number || t("that order") })}
          </p>
          <a className="btn btn-solid" href="#/shop">
            {t("Keep shopping")} <Icon name="arrow" />
          </a>
        </div>
      </Layout>
    )
  }

  const { address } = order

  // "Send this order on WhatsApp" — uses the store's contact phone from the
  // CMS (Site settings → Contact phone), normalised to international format.
  const whatsapp = (() => {
    const raw = (siteSettings.phone ?? "").replace(/[^\d+]/g, "")
    if (!raw) return null
    let intl = raw.replace(/^\+/, "")
    if (intl.startsWith("00")) intl = intl.slice(2)
    else if (intl.startsWith("0")) intl = `213${intl.slice(1)}`
    else if (!intl.startsWith("213")) intl = `213${intl}`
    const text = [
      t("Hello, here is my order:"),
      `${t("Order")} ${order.number}`,
      `${t("Total")}: ${formatMoney(order.total)}`,
      `${wilayaDisplay(address.region)} — ${tr(address.city)}`,
      `${tr(address.firstName)} ${tr(address.lastName)} · ${tr(address.phone)}`,
    ].join("\n")
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
  })()
  const steps: { icon: IconName; title: string; text: string }[] = [
    {
      icon: "phone",
      title: t("We will call you"),
      text: t("Our team phones {phone} to confirm your order. Please keep your phone close.", { phone: address.phone }),
    },
    {
      icon: "box",
      title: t("We pack it"),
      text: t("Once confirmed, your order leaves the studio within 24 hours and is handed to dhd."),
    },
    {
      icon: "truck",
      title: t("Arrives in {delivery}", { delivery: deliveryWindow(address.region) }),
      text: t("{method} to {city}, {region}. If the size is not right, exchanges are available.", {
        method: tr(order.methodLabel),
        city: address.city,
        region: wilayaDisplay(address.region),
      }),
    },
  ]

  return (
    <Layout overlayHeader={false}>
      <div className="order">
        <header className="order-hero">
          <Hanko tone="red" size="4.5rem" label={t("Order confirmed")} />
          <p className="label">{t("Order confirmed")}</p>
          <h1 ref={heading} tabIndex={-1} className="order-title">
            {t("Thank you, {name}.", { name: address.firstName })}
          </h1>
          <p className="order-lede">
            {t("Your order is in. We are getting it ready now.")}
          </p>

          <div className="order-number">
            <div>
              <p className="label">{t("Order number")}</p>
              <p className="order-number-value">{order.number}</p>
              <p className="order-date">
                {t("Placed")} {placed.format(new Date(order.placedAt))}
              </p>
            </div>
            <button type="button" className="order-copy" onClick={copy}>
              {copied ? t("Copied") : t("Copy number")}
              <span className="sr-only" role="status">
                {copied ? t("Order number copied") : ""}
              </span>
            </button>
          </div>
        </header>

        <div className="order-grid">
          <section aria-labelledby="next-title" className="order-next">
            <h2 id="next-title" className="order-h">
              {t("What happens next")}
            </h2>
            <ol>
              {steps.map((step, position) => (
                <li key={step.title}>
                  <span className="order-step-n" aria-hidden="true">
                    {position + 1}
                  </span>
                  <Icon name={step.icon} />
                  <div>
                    <h3>{tr(step.title)}</h3>
                    <p>{tr(step.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <aside className="order-account" aria-label={t("Track this order")}>
              <Icon name="box" />
              {user ? (
                <p>
                  {t("Follow every step from packed to delivered in")}{" "}
                  <a href="#/account?tab=orders">{t("your account")}</a>.
                </p>
              ) : (
                <p>
                  <a
                    href={`#/register?email=${encodeURIComponent(order.email)}&next=${encodeURIComponent("#/account?tab=orders")}`}
                  >
                    {t("Create an account")}
                  </a>{" "}
                  {t("to track this order and save your address for next time.")}
                </p>
              )}
            </aside>
            <div className="order-actions">
              <a className="btn btn-solid btn-lg" href="#/shop">
                {t("Continue shopping")} <Icon name="arrow" />
              </a>
              {whatsapp && (
                <a className="btn btn-lg" href={whatsapp} target="_blank" rel="noreferrer">
                  <Icon name="phone" /> {t("Send order on WhatsApp")}
                </a>
              )}
              <a className="co-link" href="#/">
                <Icon name="arrow" /> {t("Back to home")}
              </a>
            </div>
          </section>

          <aside className="order-recap" aria-labelledby="recap-title">
            <h2 id="recap-title" className="order-h">
              {t("Order summary")}
            </h2>
            <ul className="co-items">
              {order.lines.map((line) => (
                <li key={line.id}>
                  <div className="co-item-media">
                    <StoreImage className="photo" src={line.image} alt="" width={64} height={80} />
                    <span className="co-item-qty" aria-hidden="true">
                      {line.qty}
                    </span>
                  </div>
                  <div className="co-item-text">
                    <p>{tr(line.name)}</p>
                    <p className="label">
                      {tr(line.color)}
                      {line.size && <span className="line-size">{t("Size")} {tr(line.size)}</span>}
                      <span className="sr-only">{t(", quantity")} {line.qty}</span>
                    </p>
                  </div>
                  <p className="co-item-price">
                    {formatMoney(line.price * line.qty)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="summary-rows">
              <div>
                <dt>{t("Subtotal")}</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              <div>
                <dt>{t("Delivery ({method})", { method: tr(order.methodLabel) })}</dt>
                <dd>{order.shipping === 0 ? t("Free") : formatMoney(order.shipping)}</dd>
              </div>
              <div className="summary-total">
                <dt>{t("Total")}</dt>
                <dd>
                      {formatMoney(order.total)}
                </dd>
              </div>
            </dl>

            <dl className="order-details">
              <div>
                <dt>{t("Delivering to")}</dt>
                <dd>
                  {tr(address.firstName)} {tr(address.lastName)}
                  <br />
                  {tr(address.address1)}
                  {address.address2 && <>, {tr(address.address2)}</>}
                  <br />
                  {tr(address.city)}, {wilayaDisplay(address.region)}
                  <br />
                  {tr(address.phone)}
                </dd>
              </div>
              <div>
                <dt>{t("Payment")}</dt>
                <dd>
                  {t("Cash on delivery. Pay {total} to the courier.", { total: formatMoney(order.total) })}
                </dd>
              </div>
              {order.note && (
                <div>
                  <dt>{t("Your note")}</dt>
                  <dd>{tr(order.note)}</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
