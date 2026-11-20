import Link from "next/link"
import { getCategory, updateCategory } from "@/features/categories/backend"
import type { LeanCategory } from "@/features/admin/actions-shared"
import { ImageUploadField } from "@/features/media/ImageUploadField"
import { notFound, redirect } from "next/navigation"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditCategoryPage({ params }: PageProps) {
  const { id } = await params
  const category = await getCategory(id)

  if (!category) notFound()

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
          <li aria-current="page">{category.name}</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 03 / EDIT CATEGORY · カテゴリー編集 ]</div>
            <h1 className="admin-page-title">EDIT CATEGORY</h1>
            <p className="admin-page-subtitle">
              {category.name} (/{category.slug}) · Update banner graphics and display hierarchy.
            </p>
          </div>
        </div>
      </header>

      <EditCategoryForm category={category} />
    </div>
  )
}

async function EditCategoryForm({ category }: { category: LeanCategory }) {
  async function handleSubmit(formData: FormData) {
    "use server"
    await updateCategory(String(category._id), {
      name: formData.get("name") as string,
      showInNav: formData.get("showInNav") !== null,
      tileImage: formData.get("tileImage") as string || undefined,
      tileHoverImage: formData.get("tileHoverImage") as string || undefined,
      tileAlt: formData.get("tileAlt") as string || undefined,
    })
    redirect("/manage/categories")
  }

  const tileImg = category.tileImage as { _id?: string; url?: string } | null | undefined
  const tileHoverImg = category.tileHoverImage as { _id?: string; url?: string } | null | undefined

  return (
    <form action={handleSubmit} className="admin-form" noValidate>
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Category Details</h2>

        <div className="admin-field">
          <label htmlFor="name" className="admin-field-label">Name *</label>
          <input id="name" name="name" type="text" defaultValue={category.name} required className="admin-field-input" placeholder="Category name" />
        </div>

        <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.75rem" }}>
          <input
            id="showInNav"
            name="showInNav"
            type="checkbox"
            defaultChecked={category.showInNav !== false}
            style={{ width: "1.25rem", height: "1.25rem", accentColor: "#ffffff" }}
          />
          <label htmlFor="showInNav" className="admin-field-label" style={{ margin: 0, fontSize: "0.75rem", color: "#ffffff" }}>
            Show in top navigation
          </label>
        </div>

        <ImageUploadField
          name="tileImage"
          label="Tile Banner Image"
          defaultValue={tileImg?._id ? String(tileImg._id) : ""}
          defaultUrl={tileImg?.url ?? ""}
        />

        <ImageUploadField
          name="tileHoverImage"
          label="Tile Hover Image"
          defaultValue={tileHoverImg?._id ? String(tileHoverImg._id) : ""}
          defaultUrl={tileHoverImg?.url ?? ""}
          hint="Optional. Displayed when customer hovers over category tile."
        />

        <div className="admin-field">
          <label htmlFor="tileAlt" className="admin-field-label">Banner Alt Text</label>
          <input id="tileAlt" name="tileAlt" type="text" defaultValue={String(category.tileAlt || "")} className="admin-field-input" placeholder="Short description for accessibility" />
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Link href="/manage/categories" className="admin-btn admin-btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="admin-btn admin-btn-primary">
          Update Category
        </button>
      </div>
    </form>
  )
}
