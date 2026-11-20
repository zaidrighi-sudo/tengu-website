import Link from "next/link"
import { createCategory } from "@/features/categories/backend"
import { ImageUploadField } from "@/features/media/ImageUploadField"
import { redirect } from "next/navigation"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

export default async function AdminNewCategoryPage() {
  return <NewCategoryForm />
}

async function NewCategoryForm() {
  async function handleSubmit(formData: FormData) {
    "use server"
    await createCategory({
      name: formData.get("name") as string,
      showInNav: formData.get("showInNav") !== null,
      tileImage: formData.get("tileImage") as string || undefined,
      tileHoverImage: formData.get("tileHoverImage") as string || undefined,
      tileAlt: formData.get("tileAlt") as string || undefined,
    })
    redirect("/manage/categories")
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li>
            <Link href="/manage/categories">CATEGORIES</Link>
          </li>
          <li aria-current="page">NEW</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 03 / NEW CATEGORY · カテゴリー登録 ]</div>
            <h1 className="admin-page-title">NEW CATEGORY</h1>
            <p className="admin-page-subtitle">
              Add a new apparel grouping and banner assets for storefront navigation.
            </p>
          </div>
        </div>
      </header>

      <form action={handleSubmit} className="admin-form" noValidate>
        <section className="admin-form-section">
          <h2 className="admin-form-section-title">Category Details</h2>

          <div className="admin-field">
            <label htmlFor="name" className="admin-field-label">Name *</label>
            <input id="name" name="name" type="text" required className="admin-field-input" placeholder="e.g. Hoodies, Tees, Outerwear" />
          </div>

          <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
            <input
              id="showInNav"
              name="showInNav"
              type="checkbox"
              defaultChecked
              style={{ width: "1.25rem", height: "1.25rem", accentColor: "#ffffff" }}
            />
            <label htmlFor="showInNav" className="admin-field-label" style={{ margin: 0, fontSize: "0.75rem", color: "#ffffff" }}>
              Show in top navigation
            </label>
          </div>

          <ImageUploadField name="tileImage" label="Tile Banner Image" />

          <ImageUploadField
            name="tileHoverImage"
            label="Tile Hover Image"
            hint="Optional. Displayed when customer hovers over category tile."
          />

          <div className="admin-field">
            <label htmlFor="tileAlt" className="admin-field-label">Banner Alt Text</label>
            <input id="tileAlt" name="tileAlt" type="text" className="admin-field-input" placeholder="Short description for accessibility" />
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Link href="/manage/categories" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Create Category
          </button>
        </div>
      </form>
    </div>
  )
}
