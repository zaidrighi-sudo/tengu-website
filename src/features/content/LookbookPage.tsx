import { Icon } from "@/store/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { lookbookChapters } from "@/features/content/content"
import { type Product, photos, products } from "@/features/products/products"
import { t, tr } from "@/shared/i18n"
import { StoreImage } from "@/shared/components/StoreImage"

type Look = {
  src: string
  alt: string
  caption: string
  shape: "wide" | "tall" | "square"
  piece: string
  href: string
}

const piece = (product: Product, image: "image" | "hoverImage" = "hoverImage"): Pick<Look, "src" | "piece" | "href"> => ({
  src: product[image],
  piece: product.name,
  href: `#/shop?category=${encodeURIComponent(product.category)}`,
})

/** Second chapter: favourite pieces by name, topped up from the catalogue when one is gone. */
const FEATURED = ["Oni Heavyweight Hoodie", "Kage Utility Jogger", "Ishi Heavy Hoodie", "Oka Overshirt"]

const secondChapter = [
  { alt: "Model in a heavyweight black hoodie", caption: "Fig. 05 — Cedar line", shape: "tall" },
  { alt: "Model in charcoal utility joggers", caption: "Fig. 06 — Stairwell", shape: "wide" },
  { alt: "Model in an oversized charcoal hoodie", caption: "Fig. 07 — First light", shape: "square" },
  { alt: "Model in a relaxed black overshirt", caption: "Fig. 08 — Below the ridge", shape: "tall" },
] as const

function buildLooks(): Look[][] {
  const picked = FEATURED.flatMap((name) => products.find((product) => product.name === name) ?? [])
  const spare = products.filter((product) => !picked.includes(product))
  const pieces = [...picked, ...spare].slice(0, secondChapter.length)
  return [
    [
      { src: photos.lookA, alt: "Pedestrians crossing a Tokyo street at night", caption: "Fig. 01 — Shibuya, 02:14", shape: "wide", piece: "Oni Heavyweight Hoodie", href: "#/shop?category=Hoodies" },
      { src: photos.lookB, alt: "Skater in black clothing rolling down a night road", caption: "Fig. 02 — Last train", shape: "tall", piece: "Kage Utility Jogger", href: "#/shop?category=Joggers" },
      { src: photos.lookC, alt: "Woman in a cap and dark jacket on an empty road", caption: "Fig. 03 — Off the grid", shape: "square", piece: "Outerwear", href: "#/shop?category=Outerwear" },
      { src: photos.lookD, alt: "Woman standing on a street corner at night", caption: "Fig. 04 — Quiet hours", shape: "tall", piece: "Graphic tees", href: "#/shop?category=Tees" },
    ],
    pieces.map((product, index) => ({ ...piece(product), ...secondChapter[index] })),
  ]
}

export default function Lookbook() {
  const looks = buildLooks()
  let figure = 0
  return (
    <Layout overlayHeader={false}>
      <div className="lookpage">
        <PageHead
          crumb={t("Lookbook")}
          eyebrow={t("AW25")}
          title={t("Lookbook")}
          intro={t("Shot after dark, between trains. Dark by design, loud by accident.")}
        />

        {looks.map((chapter, index) => (
          <section key={lookbookChapters[index].id} className="lookpage-chapter" aria-labelledby={`ch-${index}`}>
            <header className="lookpage-chapter-head">
              <p className="label">{t("Chapter")} {index === 0 ? "I" : t("II")}</p>
              <h2 id={`ch-${index}`}>{tr(lookbookChapters[index].title)}</h2>
              <p>{tr(lookbookChapters[index].note)}</p>
            </header>
            <ul className="lookpage-grid">
              {chapter.map((look) => {
                figure++
                return (
                  <li key={look.caption} className={`lookpage-item is-${look.shape}`}>
                    <figure>
                      <div className="lookpage-frame">
                        <StoreImage className="photo" src={look.src} alt={tr(look.alt)} sizes="100vw" />
                      </div>
                      <figcaption>
                        <span className="label">{tr(look.caption)}</span>
                        <a href={look.href}>
                          {t("Shop")} {tr(look.piece)} <Icon name="arrow" />
                        </a>
                      </figcaption>
                    </figure>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        <section className="lookpage-end">
          <p>{t("Wear it after dark.")}</p>
          <a className="btn btn-solid btn-lg" href="#/shop?new=1">
            {t("Shop the drop")} <Icon name="arrow" />
          </a>
        </section>
      </div>
    </Layout>
  )
}
