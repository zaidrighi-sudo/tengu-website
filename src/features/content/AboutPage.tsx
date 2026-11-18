import { Hanko } from "@/features/shell/Hanko"
import { Icon } from "@/store/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { photos } from "@/features/products/products"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

const chapters = [
  {
    no: "I",
    title: "The mountain",
    text: [
      "In the folklore of Japan the tengu lives where the cedar line ends. Part spirit, part bird, part warrior. Nobody agrees on exactly what it is, which is the point.",
      "The old stories name two kinds. The daitengu, red-faced and long-nosed, carries a fan of feathers. The karasu-tengu has a crow's beak and a quicker, quieter temper.",
    ],
  },
  {
    no: "II",
    title: "The trickster",
    text: [
      "Early tales cast the tengu as a proud and dangerous thing. It led arrogant monks astray, tangled travellers on the path, and laughed from the treeline afterwards.",
      "Pride was its weakness and its lesson. Anyone who thought they had reached the top of the mountain found a tengu already waiting there.",
    ],
  },
  {
    no: "III",
    title: "The teacher",
    text: [
      "Later stories soften the creature into a guardian of the forest and a master of the sword. The tengu took in the worthy, and taught them in the dark, and never once announced itself.",
      "It taught those who never asked. That is the part we kept.",
    ],
  },
  {
    no: "IV",
    title: "The label",
    text: [
      "Tengu is a small studio making heavyweight streetwear in short runs. We cut heavy, we dye dark, and we stop when a run is gone.",
      "We borrowed the name for the one who watches from the ridge: quiet, proud of the work, and never in a hurry to be noticed.",
    ],
  },
]

const faces = [
  { name: "Daitengu", note: "The great tengu", text: "Red face, long nose, a fan of feathers. The old master of the mountain: loud in legend, still in person." },
  { name: "Karasu-tengu", note: "The crow tengu", text: "A beak, black wings and a lighter step. The messenger and watcher: fast, quiet, and gone before you turn." },
]

const principles = [
  { no: "01", title: "Cut heavy", text: "Dense fleece, thick jersey, real weight. Pieces that hold their shape and hang right." },
  { no: "02", title: "Short runs", text: "We make small numbers on purpose. When a run is gone it is gone, and that keeps it honest." },
  { no: "03", title: "Quiet by design", text: "Nothing unnecessary. Dark colours, clean lines and a mark you find rather than a logo that finds you." },
]

export default function About() {
  return (
    <Layout overlayHeader={false}>
      <div className="about">
        <PageHead
          crumb={t("About")}
          eyebrow={t("The legend")}
          title={t("Something watches from the ridge.")}
          intro={t("Spirit of the mountain. Trickster, warrior, teacher of those who never ask.")}
        />

        <figure className="about-hero">
          <StoreImage className="photo" src={photos.story} alt={t("A dark mountain ridge at dusk")} sizes="100vw" />
          <span className="about-kanji" lang="ja" aria-hidden="true">
            天狗
          </span>
          <figcaption className="label">{t("Tengu — 天狗 — “heavenly dog”")}</figcaption>
        </figure>

        <section className="about-chapters" aria-label={t("The legend of the tengu")}>
          {chapters.map((chapter) => (
            <article key={chapter.no} className="about-chapter">
              <p className="about-no" aria-hidden="true">
                {tr(chapter.no)}
              </p>
              <h2>{tr(chapter.title)}</h2>
              <div>
                {chapter.text.map((paragraph) => (
                  <p key={paragraph}>{tr(paragraph)}</p>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="about-faces" aria-labelledby="faces-title">
          <h2 id="faces-title" className="about-h">
            {t("Two faces")}
          </h2>
          <div className="about-faces-grid">
            {faces.map((face) => (
              <article key={face.name}>
                <p className="label">{tr(face.note)}</p>
                <h3>{tr(face.name)}</h3>
                <p>{tr(face.text)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-principles" aria-labelledby="principles-title">
          <h2 id="principles-title" className="about-h">
            {t("What we hold to")}
          </h2>
          <ol>
            {principles.map((principle) => (
              <li key={principle.no}>
                <span className="about-no" aria-hidden="true">
                  {tr(principle.no)}
                </span>
                <h3>{tr(principle.title)}</h3>
                <p>{tr(principle.text)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-cta">
          <Hanko size="4rem" label={t("Tengu seal")} />
          <p>{t("It never announces itself. Neither do we.")}</p>
          <div className="about-cta-actions">
            <a className="btn btn-solid btn-lg" href="#/shop?new=1">
              {t("Shop the drop")} <Icon name="arrow" />
            </a>
            <a className="co-link co-link-fwd" href="#/lookbook">
              <Icon name="arrow" /> {t("See the lookbook")}
            </a>
          </div>
        </section>
      </div>
    </Layout>
  )
}
