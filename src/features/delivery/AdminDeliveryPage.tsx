import Link from "next/link"
import { getDeliverySettings, updateDeliverySettings } from "@/features/delivery/backend"
import type { LeanDeliverySettings } from "@/features/admin/actions-shared"
import { resolveZoneFees } from "@/features/delivery/delivery"
import { COMMUNES_BY_CODE, DEFAULT_WILAYAS, communeKey } from "@/features/delivery/algeria-data"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

export default async function AdminDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ wilaya?: string }>
}) {
  const settings = await getDeliverySettings()
  const params = await searchParams
  const selected = DEFAULT_WILAYAS.find((w) => w.code === String(params.wilaya ?? "").padStart(2, "0")) ??
    DEFAULT_WILAYAS.find((w) => w.code === "16") ??
    DEFAULT_WILAYAS[0]

  // Effective zone fees for this wilaya: CMS zone table wins over the static defaults.
  const zoneFees = resolveZoneFees(settings)
  const inherited = zoneFees[selected.zone]

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">DELIVERY</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 10 / LOGISTICS · 配送設定 ]</div>
            <h1 className="admin-page-title">DELIVERY SETTINGS</h1>
            <p className="admin-page-subtitle">
              Every commune has its own price. Set the home courier fee and the stop-desk fee for each
              commune; the storefront, checkout and orders all use these numbers.
            </p>
          </div>
        </div>
      </header>

      <DeliveryForm settings={settings} selectedWilaya={selected.code} inherited={inherited} />
    </div>
  )
}

async function DeliveryForm({
  settings,
  selectedWilaya,
  inherited,
}: {
  settings: LeanDeliverySettings
  selectedWilaya: string
  inherited: { home: number; desk: number; days: [number, number] }
}) {
  async function handleSubmit(formData: FormData) {
    "use server"
    const data: Record<string, unknown> = {}
    const communeFees: Record<string, unknown>[] = []

    let reset = false
    for (const [key, value] of formData.entries()) {
      if (key === "resetCommunes") {
        // "Reset commune prices" was clicked: wipe this wilaya's commune overrides.
        reset = true
        continue
      }
      if (key === "communeWilaya") {
        data.communeWilaya = value
        continue
      }
      if (key.startsWith("communeFees[")) {
        const match = key.match(/communeFees\[(\d+)\]\[(\w+)\]/)
        if (match) {
          const index = parseInt(match[1], 10)
          const field = match[2]
          if (!communeFees[index]) communeFees[index] = {}
          communeFees[index][field] = value
        }
        continue
      }
      data[key] = value
    }

    if (reset) data.communeFees = []
    else if (communeFees.length > 0) data.communeFees = communeFees
    await updateDeliverySettings(data)
  }

  const freeShippingThreshold = Number(settings.freeShippingThreshold) || 15000
  // A stored 0 disables the loyalty reward; undefined/null means "never saved" -> 15000.
  const loyaltyRaw = settings.loyaltyFreeDeliveryThreshold
  const loyaltyFreeDeliveryThreshold =
    loyaltyRaw === undefined || loyaltyRaw === null || Number.isNaN(Number(loyaltyRaw))
      ? 15000
      : Number(loyaltyRaw)

  // Commune drill-down for the selected wilaya.
  const selected = DEFAULT_WILAYAS.find((w) => w.code === selectedWilaya) ?? DEFAULT_WILAYAS[0]
  const communes = COMMUNES_BY_CODE.get(selected.code) ?? []
  const overrides = new Map(
    (settings.communeFees ?? [])
      .filter((row) => String(row.wilayaCode).padStart(2, "0") === selected.code)
      .map((row) => [communeKey(row.commune), row]),
  )

  const inputStyle = { width: "6.5rem", maxWidth: "100%" } as const

  return (
    <>
      <form action="/manage/delivery" method="get" style={{ marginBottom: "var(--space-4)" }}>
        <div className="admin-field-row" style={{ alignItems: "flex-end" }}>
          <div className="admin-field" style={{ maxWidth: "22rem" }}>
            <label htmlFor="wilayaPicker" className="admin-field-label">Jump to a wilaya</label>
            <select id="wilayaPicker" name="wilaya" defaultValue={selected.code} className="admin-field-select">
              {DEFAULT_WILAYAS.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} — {wilaya.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <button type="submit" className="admin-btn admin-btn-secondary">Show communes</button>
          </div>
        </div>
      </form>

      <form action={handleSubmit} className="admin-form" noValidate>
        <input type="hidden" name="communeWilaya" value={selected.code} />

        <section className="admin-form-section">
          <h2 className="admin-form-section-title">General Delivery Rules</h2>
          <div className="admin-field">
            <label htmlFor="freeShippingThreshold" className="admin-field-label">Free Delivery Threshold (DZD)</label>
            <input
              id="freeShippingThreshold"
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="500"
              defaultValue={freeShippingThreshold}
              className="admin-field-input"
              style={{ maxWidth: "20rem" }}
            />
            <p style={{ fontSize: "0.6875rem", color: "var(--admin-muted)", margin: "0.25rem 0 0" }}>
              Cart totals exceeding this threshold automatically qualify for complimentary home delivery.
            </p>
          </div>
          <div className="admin-field" style={{ marginTop: "1rem" }}>
            <label htmlFor="loyaltyFreeDeliveryThreshold" className="admin-field-label">Loyalty: Free Home Delivery after Lifetime Spend (DZD)</label>
            <input
              id="loyaltyFreeDeliveryThreshold"
              name="loyaltyFreeDeliveryThreshold"
              type="number"
              min="0"
              step="1000"
              defaultValue={loyaltyFreeDeliveryThreshold}
              className="admin-field-input"
              style={{ maxWidth: "20rem" }}
            />
            <p style={{ fontSize: "0.6875rem", color: "var(--admin-muted)", margin: "0.25rem 0 0" }}>
              When a customer&apos;s delivered orders total this amount or more, home delivery is free from then on — every order, every commune. Stop-desk pickup stays at the commune price. Set 0 to turn the loyalty reward off.
            </p>
          </div>
        </section>

        <section className="admin-form-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
            <div>
              <h2 className="admin-form-section-title" style={{ marginBottom: "0.25rem" }}>
                Commune Fees — {selected.name}
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--admin-muted)", lineHeight: 1.5, margin: 0 }}>
                Every commune has a price. Rows marked <strong>ZONE</strong> inherit the Z{selected.zone} price ({inherited.home} / {inherited.desk} DZD, {inherited.days[0]}–{inherited.days[1]} days);
                rows you edit become overrides. Entries equal to the zone price are not stored. Only this wilaya is affected by saving here;
                other wilayas keep their overrides.
              </p>
            </div>
            <button type="submit" name="resetCommunes" value="1" className="admin-btn admin-btn-ghost" style={{ whiteSpace: "nowrap" }}>
              Reset {selected.name} to zone prices
            </button>
          </div>

          <div className="admin-table-container" style={{ maxHeight: "42rem", overflowY: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Commune</th>
                  <th scope="col">Source</th>
                  <th scope="col">Home (DZD)</th>
                  <th scope="col">Stop-Desk (DZD)</th>
                </tr>
              </thead>
              <tbody>
                {communes.map((commune, index) => {
                  const override = overrides.get(communeKey(commune.name))
                  const home = override ? Number(override.homeFee) : inherited.home
                  const desk = override ? Number(override.deskFee) : inherited.desk
                  return (
                    <tr key={commune.name}>
                      <td>{index + 1}</td>
                      <td>
                        <strong style={{ fontWeight: 600 }}>{commune.name}</strong>
                        <span style={{ color: "var(--admin-muted)", fontSize: "0.75rem", marginInlineStart: "0.5rem" }} lang="ar" dir="rtl">
                          {commune.arabic}
                        </span>
                        <input type="hidden" name={`communeFees[${index}][wilayaCode]`} value={selected.code} />
                        <input type="hidden" name={`communeFees[${index}][commune]`} value={commune.name} />
                      </td>
                      <td>
                        <span className={`admin-tag ${override ? "" : "admin-tag-out"}`} style={{ fontSize: "0.5625rem" }}>
                          {override ? "OVERRIDE" : "ZONE"}
                        </span>
                      </td>
                      <td>
                        <input
                          id={`communeFees[${index}][homeFee]`}
                          name={`communeFees[${index}][homeFee]`}
                          type="number"
                          min="0"
                          step="50"
                          defaultValue={home}
                          className="admin-field-input"
                          style={inputStyle}
                          aria-label={`Home fee for ${commune.name}`}
                        />
                      </td>
                      <td>
                        <input
                          id={`communeFees[${index}][deskFee]`}
                          name={`communeFees[${index}][deskFee]`}
                          type="number"
                          min="0"
                          step="50"
                          defaultValue={desk}
                          className="admin-field-input"
                          style={inputStyle}
                          aria-label={`Stop-desk fee for ${commune.name}`}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button type="submit" className="admin-btn admin-btn-primary">
            Save Delivery Settings
          </button>
        </div>
      </form>
    </>
  )
}
