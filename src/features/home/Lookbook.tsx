import { Icon } from "@/shared/components/Icon"
import { SectionHeading } from "@/features/shell/SectionHeading"
import { photos } from "@/features/products/products"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

const shots = [
  {
    key: "a",
    src: photos.lookA,
    alt: "Pedestrians crossing a Tokyo street at night",
    caption: "Fig. 01 — Shibuya, 02:14",
  },
  {
    key: "b",
    src: photos.lookB,
    alt: "Skater in black clothing rolling down a night road",
    caption: "Fig. 02 — Last train",
  },
  {
    key: "c",
    src: photos.lookC,
    alt: "Woman in a cap and dark jacket on an empty road",
    caption: "Fig. 03 — Off the grid",
  },
  {
    key: "d",
    src: photos.lookD,
    alt: "Woman standing on a street corner at night",
    caption: "Fig. 04 — Quiet hours",
  },
]

/** Full-width editorial collage with deliberately uneven image sizes. */
export function Lookbook() {
  return (
    <section
      className="lookbook"
      id="lookbook"
      aria-labelledby="lookbook-title"
    >
      <div className="lookbook-head" data-reveal>
        <div id="lookbook-title">
          <SectionHeading index="03" title={t("Lookbook")} />
        </div>
        <div className="lookbook-side">
          <p className="lookbook-note">{t("AW25 — shot after dark, between trains.")}</p>
          <a className="link-fwd" href="#/lookbook">
            {t("View the full lookbook")} <Icon name="arrow" />
          </a>
        </div>
      </div>

      <div className="lookbook-grid">
        {shots.map((shot) => (
          <figure
            key={shot.key}
            className={`look look-${shot.key}`}
            data-reveal="mask"
          >
            <div className="look-frame">
              <StoreImage className="photo" src={shot.src} alt={tr(shot.alt)} sizes="100vw" />
            </div>
            <figcaption className="label">{tr(shot.caption)}</figcaption>
          </figure>
        ))}

        <p className="look-statement" data-reveal>
          {t("Dark by design.")}
          <br />
          {t("Loud by accident.")}
        </p>
      </div>
    </section>
  )
}
