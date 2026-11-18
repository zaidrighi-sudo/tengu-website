import { useState } from "react"
import { Icon } from "@/shared/components/Icon"
import { Layout } from "@/features/shell/Layout"
import { PageHead } from "@/shared/components/PageHead"
import { fitGuide, guideSizes, measureSteps, sizeTables } from "@/features/content/content"
import { cn } from "@/shared/utils/cn"
import { t, tr } from "@/shared/i18n"

type Unit = "in" | "cm"

const convert = (value: number, unit: Unit) =>
  unit === "in" ? String(value) : String(Math.round(value * 2.54))

const show = (value: number | [number, number], unit: Unit) =>
  Array.isArray(value)
    ? `${convert(value[0], unit)}–${convert(value[1], unit)}`
    : convert(value, unit)

export default function SizeGuide() {
  const [unit, setUnit] = useState<Unit>("in")
  const [tableId, setTableId] = useState(sizeTables[0].id)
  const table = sizeTables.find((t) => t.id === tableId) ?? sizeTables[0]

  return (
    <Layout overlayHeader={false}>
      <div className="guide">
        <PageHead
          crumb={t("Size guide")}
          eyebrow={t("Fit")}
          title={t("Size guide")}
          intro={t("Measure once, order with confidence. Every product shows its fit, and exchanges are available within 7 days if we got it wrong.")}
        />

        <section className="guide-tool" aria-labelledby="chart-title">
          <div className="guide-controls">
            <h2 id="chart-title" className="sr-only">
              {t("Size chart")}
            </h2>
            <div className="seg" role="radiogroup" aria-label={t("Garment")}>
              {sizeTables.map((t) => (
                <label key={t.id} className={cn("seg-item", t.id === tableId && "is-on")}>
                  <input type="radio" name="garment" checked={t.id === tableId} onChange={() => setTableId(t.id)} />
                  <span>{tr(t.label)}</span>
                </label>
              ))}
            </div>
            <div className="seg seg-small" role="radiogroup" aria-label={t("Units")}>
              {(["in", "cm"] as const).map((u) => (
                <label key={u} className={cn("seg-item", u === unit && "is-on")}>
                  <input type="radio" name="unit" checked={u === unit} onChange={() => setUnit(u)} />
                  <span>{u === "in" ? t("Inches") : t("Centimetres")}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="guide-note">{tr(table.note)}</p>

          <div className="guide-table-wrap" role="region" aria-label={t("{label} measurements in {v1}", { label: tr(table.label), v1: unit === "in" ? t("inches") : t("centimetres") })} tabIndex={0}>
            <table className="guide-table">
              <caption className="sr-only">
                {tr(table.label)} {t("measurements in")} {unit === "in" ? t("inches") : t("centimetres")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("Size")}</th>
                  {table.columns.map((column) => (
                    <th key={column} scope="col">
                      {tr(column)} <span>({tr(unit)})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guideSizes.map((size) => (
                  <tr key={size}>
                    <th scope="row">{tr(size)}</th>
                    {table.rows[size].map((value, i) => (
                      <td key={table.columns[i]}>{show(value, unit)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="field-hint">{t("Accessories are one size.")}</p>
        </section>

        <section className="guide-split">
          <div aria-labelledby="fit-title">
            <h2 id="fit-title" className="about-h">
              {t("How it fits")}
            </h2>
            <dl className="fit-list">
              {fitGuide.map((fit) => (
                <div key={fit.name}>
                  <dt>{tr(fit.name)}</dt>
                  <dd>{tr(fit.text)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div aria-labelledby="measure-title">
            <h2 id="measure-title" className="about-h">
              {t("How to measure")}
            </h2>
            <ol className="measure-list">
              {measureSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="about-no" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{tr(step.title)}</h3>
                    <p>{tr(step.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="guide-tip">
              <Icon name="alert" />
              <span>
                {t("Between sizes? For oversized pieces choose your usual size for the drape or size down for a closer fit. For regular and slim, size up.")}
              </span>
            </p>
          </div>
        </section>

        <section className="guide-help">
          <p>{t("Still unsure? Tell us your height, weight and the piece, and we will suggest a size.")}</p>
          <a className="btn btn-solid" href="#/contact">
            {t("Ask us")} <Icon name="arrow" />
          </a>
        </section>
      </div>
    </Layout>
  )
}
