import Link from "next/link"
import { getCategories, getColors, createProduct } from "@/lib/admin/actions"
import { ProductForm } from "@/components/admin/ProductForm"
import { redirect } from "next/navigation"
import "@/store/styles/global.css"
import "../../admin.css"

export default async function AdminNewProductPage() {
  const [categories, colors] = await Promise.all([getCategories(), getColors()])

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li>
            <Link href="/manage/products">PRODUCTS</Link>
          </li>
          <li aria-current="page">NEW</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 02 / NEW PIECE · 新作登録 ]</div>
            <h1 className="admin-page-title">NEW PRODUCT</h1>
            <p className="admin-page-subtitle">
              Add a new apparel piece to the catalog, link colorways, and assign sizing inventory.
            </p>
          </div>
        </div>
      </header>

      <NewProductForm
        categories={categories.map((category) => ({ id: String(category._id), name: category.name }))}
        colors={colors.map((color) => ({ id: String(color._id), name: color.name, hex: color.hex }))}
      />
    </div>
  )
}

async function NewProductForm({ categories, colors }: { categories: Array<{ id: string; name: string }>; colors: Array<{ id: string; name: string; hex: string }> }) {
  async function handleSubmit(formData: Record<string, unknown>) {
    "use server"
    const product = await createProduct({
      ...formData,
      category: formData.category as string,
      price: Number(formData.price),
      compareAt: formData.compareAt ? Number(formData.compareAt) : null,
      colors: formData.colors as string[],
      active: Boolean(formData.active),
      sortOrder: Number(formData.sortOrder) || 0,
    })
    redirect(`/manage/products/${product.id}/edit`)
  }

  return <ProductForm categories={categories} colors={colors} onSubmit={handleSubmit} isNew />
}
