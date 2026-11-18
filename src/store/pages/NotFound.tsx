import { Hanko } from "@/store/components/Hanko"
import { Icon } from "@/store/components/Icon"
import { Layout } from "@/store/components/Layout"
import { useHash } from "@/store/utils/useHash"
import { t, tr } from "@/store/i18n"

const paths = [
  { label: "Shop the drop", href: "#/shop?new=1" },
  { label: "Hoodies", href: "#/shop?category=Hoodies" },
  { label: "Lookbook", href: "#/lookbook" },
  { label: "Contact", href: "#/contact" },
]

/** Unknown `#/…` routes. Witty, but still gets people moving. */
export default function NotFound() {
  const hash = useHash()
  return (
    <Layout overlayHeader={false}>
      <div className="nf">
        <p className="label">{t("Error 404 — the tengu has been at it again")}</p>
        <div className="nf-code" aria-hidden="true">
          <span>4</span>
          <span className="nf-zero">
            <Hanko text="?" size="clamp(5rem, 22vw, 15rem)" label="" />
          </span>
          <span>4</span>
        </div>
        <h1 className="nf-title">{t("Lost on the mountain.")}</h1>
        <p className="nf-text">
          {t("This page has been led astray by a trickster with an excellent nose. We checked behind the fan, under the geta, and in every cedar. A crow is out looking. Until it reports back, try one of these paths.")}
        </p>
        <p className="nf-path">
          {t("You tried:")} <code>{hash || "#/"}</code>
        </p>
        <ul className="nf-paths">
          {paths.map((path) => (
            <li key={path.label}>
              <a href={path.href}>
                {tr(path.label)} <Icon name="arrow" />
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn-solid btn-lg" href="#/">
          {t("Take me home")} <Icon name="arrow" />
        </a>
      </div>
    </Layout>
  )
}
