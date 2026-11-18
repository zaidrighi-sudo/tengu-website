import Link from "next/link"
import { getProduct, getCategories, getColors, updateProduct, type LeanProduct } from "@/lib/admin/actions"
import { ProductForm, type ProductFormData } from "@/components/admin/ProductForm"
import type { AdminProductImage } from "@/components/admin/ProductImagesManager"
import type { AdminInventoryItem } from "@/components/admin/ProductInventoryManager"
import { notFound, redirect } from "next/navigation"
import "@/store/styles/global.css"
import "../../../admin.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params
  const [product, categories, colors] = await Promise.all([
    getProduct(id),
    getCategories(),
    getColors(),
  ])

  if (!product) notFound()

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
          <li aria-current="page">{product.name}</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 02 / EDIT PIECE · 商品編集 ]</div>
            <h1 className="admin-page-title">EDIT PRODUCT</h1>
            <p className="admin-page-subtitle">
              {product.name} (/{product.slug}) · Update pricing, colorways, and inventory matrix.
            </p>
          </div>
        </div>
      </header>

      <EditProductForm
        product={product}
        categories={categories.map((category) => ({ id: String(category._id), name: category.name }))}
        colors={colors.map((color) => ({ id: String(color._id), name: color.name, hex: color.hex }))}
      />
    </div>
  )
}

async function EditProductForm({
  product,
  categories,
  colors,
}: {
  product: LeanProduct
  categories: Array<{ id: string; name: string }>
  colors: Array<{ id: string; name: string; hex: string }>
}) {
  async function handleSubmit(formData: Record<string, unknown>) {
    "use server"
    await updateProduct(String(product._id), {
      ...formData,
      category: formData.category as string,
      price: Number(formData.price),
      compareAt: formData.compareAt ? Number(formData.compareAt) : null,
      colors: formData.colors as string[],
      active: Boolean(formData.active),
      sortOrder: Number(formData.sortOrder) || 0,
    })
    redirect("/manage/products")
  }

  // Map the stored gallery to the form. Legacy products only have image and
  // hoverImage, so those become the first gallery images on their single color.
  const firstColorName = product.colors?.[0]?.name ?? ""
  const firstColorHex = product.colors?.[0]?.hex ?? "#000000"

  const images: AdminProductImage[] = (product.images ?? [])
    .filter((entry) => entry.image?.url)
    .map((entry, index) => ({
      mediaId: String(entry.image?._id ?? ""),
      url: entry.image?.url ?? "",
      color: entry.color ?? "",
      colorHex: entry.colorHex ?? firstColorHex,
      isMain: Boolean(entry.isMain),
      order: Number(entry.order) || index,
    }))
    .sort((a, b) => a.order - b.order)

  if (images.length === 0) {
    if (product.image?._id) {
      images.push({
        mediaId: String(product.image._id),
        url: product.image.url ?? "",
        color: firstColorName,
        colorHex: firstColorHex,
        isMain: true,
        order: 0,
      })
    }
    if (product.hoverImage?._id && String(product.hoverImage._id) !== String(product.image?._id)) {
      images.push({
        mediaId: String(product.hoverImage._id),
        url: product.hoverImage.url ?? "",
        color: firstColorName,
        colorHex: firstColorHex,
        isMain: false,
        order: images.length,
      })
    }
  }

  // Map the stored inventory matrix. Legacy products have sizes and inStock.
  const inventory: AdminInventoryItem[] = (product.inventory ?? []).map((item) => ({
    color: item.color,
    size: item.size,
    quantity: Number(item.quantity) || 0,
  }))

  if (inventory.length === 0 && product.sizes && product.sizes.length > 0) {
    for (const size of product.sizes) {
      inventory.push({
        color: firstColorName,
        size,
        quantity: (product as any).inStock ? 1 : 0,
      })
    }
  }

  const initialData: Partial<ProductFormData> = {
    name: product.name,
    slug: product.slug,
    category: String(product.category?._id || product.category || ""),
    price: product.price,
    compareAt: product.compareAt ?? null,
    colors: (product.colors ?? []).map((c) => c.name),
    fit: product.fit ?? "",
    images,
    inventory,
    status: (product.status as ProductFormData["status"]) ?? "",
    active: product.active ?? true,
    sortOrder: product.sortOrder ?? 0,
  }

  return (
    <ProductForm
      initialData={initialData}
      categories={categories}
      colors={colors}
      onSubmit={handleSubmit}
      isNew={false}
    />
  )
}
