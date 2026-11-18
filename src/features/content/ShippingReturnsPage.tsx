import { Icon } from "@/store/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { TrustBadges } from "@/features/shell/TrustBadges"
import { FREE_SHIPPING_THRESHOLD } from "@/features/site-settings/navigation"
import { formatMoney } from "@/shared/utils/format"
import { t, tr } from "@/shared/i18n"

const returnSteps = [
  { title: "Tell us", text: "Message us on Instagram or the contact form with your order number within 7 days of delivery." },
  { title: "Send it back", text: "Pack the piece unworn, unwashed and with tags attached. We arrange the pickup or you drop it at a dhd desk." },
  { title: "Get your size", text: "We send the new size or refund you in cash or by CCP / BaridiMob once we receive the parcel." },
]

const jump = (id: string) => () =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

export default function ShippingReturns() {
  return (
    <Layout overlayHeader={false}>
      <div className="policy">
        <PageHead
          crumb={t("Shipping and returns")}
          eyebrow={t("Help")}
          title={t("Shipping and returns")}
          intro={t("Cash on delivery to all 58 wilayas with dhd. Orders leave the studio within 24 hours of confirmation, and exchanges are easy.")}
        >
          <div className="jump">
            <button type="button" onClick={jump("shipping")}>
              {t("Shipping")}
            </button>
            <button type="button" onClick={jump("returns")}>
              {t("Returns")}
            </button>
          </div>
        </PageHead>

        <section id="shipping" className="policy-section" aria-labelledby="ship-title">
          <h2 id="ship-title" className="about-h">
            {t("Shipping")}
          </h2>
          <div className="policy-cols">
            <div>
              <p className="commune-title">{t("Priced per commune")}</p>
              <p className="commune-text">
                {t("Delivery is priced for every commune in the country. Choose your wilaya and commune at checkout and the exact fee — home or stop-desk — is shown before you pay.")}
              </p>
              <p className="commune-free">{t("Home delivery is free over {price}. Times start when your order ships.", { price: formatMoney(FREE_SHIPPING_THRESHOLD) })}</p>
            </div>
            <ul className="policy-points">
              <li>
                <h3>{t("Confirmation call")}</h3>
                <p>{t("After you order, we phone you to confirm. Orders leave the studio within 24 hours of that call, Sunday to Thursday.")}</p>
              </li>
              <li>
                <h3>{t("Where we deliver")}</h3>
                <p>{t("All 58 wilayas, to your door or to the dhd stop-desk of your choice.")}</p>
              </li>
              <li>
                <h3>{t("Cash on delivery")}</h3>
                <p>{t("You pay the courier in cash when the parcel arrives. Open it, check it, then pay. No card needed.")}</p>
              </li>
            </ul>
          </div>
        </section>

        <section id="returns" className="policy-section" aria-labelledby="ret-title">
          <h2 id="ret-title" className="about-h">
            {t("Returns and exchanges")}
          </h2>
          <ol className="policy-steps">
            {returnSteps.map((step, index) => (
              <li key={step.title}>
                <span className="about-no" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{tr(step.title)}</h3>
                <p>{tr(step.text)}</p>
              </li>
            ))}
          </ol>
          <ul className="policy-points policy-points-wide">
            <li>
              <h3>{t("What can come back")}</h3>
              <p>{t("Anything unworn and unwashed, with its tags attached, within 7 days of delivery.")}</p>
            </li>
            <li>
              <h3>{t("Exchanges")}</h3>
              <p>{t("For a different size, send the piece back and we ship the new size as soon as it is available. Delivery fees for exchanges are shared.")}</p>
            </li>
            <li>
              <h3>{t("Faulty or wrong item")}</h3>
              <p>{t("If something arrives damaged, or is not what you ordered, tell us on the spot or within 24 hours and we will replace it or refund it, including the delivery fee.")}</p>
            </li>
          </ul>
          <div className="policy-cta">
            <a className="btn btn-solid" href="#/contact">
              {t("Start a return")} <Icon name="arrow" />
            </a>
            <a className="co-link co-link-fwd" href="#/faq">
              <Icon name="arrow" /> {t("Read the FAQ")}
            </a>
          </div>
        </section>

        <TrustBadges layout="row" className="policy-trust" />
      </div>
    </Layout>
  )
}
