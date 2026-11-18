import Link from "next/link"
import { createColor } from "@/lib/admin/actions/colors"
import { redirect } from "next/navigation"
import "@/store/styles/global.css"
import "../../admin.css"

export default async function AdminNewColorPage() {
  return <NewColorForm />
}

async function NewColorForm() {
  async function handleSubmit(formData: FormData) {
    "use server"
    await createColor({
      name: formData.get("name") as string,
      hex: formData.get("hex") as string,
      sortOrder: Number(formData.get("sortOrder")) || 0,
      isActive: formData.get("isActive") === "on",
    })
    redirect("/manage/colors")
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li>
            <Link href="/manage/colors">COLORS</Link>
          </li>
          <li aria-current="page">NEW</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 06 / NEW COLOR · カラー登録 ]</div>
            <h1 className="admin-page-title">NEW COLOR</h1>
            <p className="admin-page-subtitle">
              Define a new catalog colorway, set the hex code, and assign sorting priority.
            </p>
          </div>
        </div>
      </header>

      <form action={handleSubmit} className="admin-form" noValidate>
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Color Details</h2>

          <div className="admin-field">
            <label htmlFor="name" className="admin-field-label">Name *</label>
            <input id="name" name="name" type="text" required className="admin-field-input" placeholder="e.g. Washed Black, Vintage Grey, Bone" />
          </div>

          <div className="admin-field">
            <label htmlFor="hex" className="admin-field-label">Hex Code *</label>
            <input id="hex" name="hex" type="text" required className="admin-field-input" placeholder="#000000" pattern="#[0-9A-Fa-f]{6}" style={{ fontFamily: "var(--font-mono)", maxWidth: "12rem" }} />
            <p style={{ fontSize: "0.6875rem", color: "var(--admin-muted)", margin: "0.25rem 0 0" }}>Format: 6-character hex like #0A0A0A or #FFFFFF</p>
          </div>

          <div className="admin-field-row">
            <div className="admin-field">
              <label htmlFor="sortOrder" className="admin-field-label">Sort Order</label>
              <input id="sortOrder" name="sortOrder" type="number" min="0" step="1" defaultValue={0} className="admin-field-input" style={{ maxWidth: "12rem" }} />
            </div>
            <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem", paddingTop: "1.25rem" }}>
              <input id="isActive" name="isActive" type="checkbox" defaultChecked style={{ width: "1.25rem", height: "1.25rem", accentColor: "#ffffff" }} />
              <label htmlFor="isActive" className="admin-field-label" style={{ margin: 0, fontSize: "0.75rem", color: "#ffffff" }}>Active in store filters</label>
            </div>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Link href="/manage/colors" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Create Color
          </button>
        </div>
      </form>
    </div>
  )
}
