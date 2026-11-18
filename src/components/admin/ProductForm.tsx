"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/store/utils/cn"
import { FIT_OPTIONS } from "@/lib/product-constants"
import { ProductImagesManager, type AdminProductImage } from "./ProductImagesManager"
import { ProductInventoryManager, type AdminInventoryItem } from "./ProductInventoryManager"

export type ProductFormData = {
  name: string
  slug: string
  category: string
  price: number
  compareAt: number | null
  /** Legacy CMS color relationships, derived from the gallery colors on save. */
  colors: string[]
  fit: string
  /** Gallery: one entry per uploaded image, each linked to a color. */
  images: AdminProductImage[]
  /** Stock per color + size. */
  inventory: AdminInventoryItem[]
  status: "new" | "sale" | "soldout" | ""
  active: boolean
  sortOrder: number
}

const initialData: ProductFormData = {
  name: "",
  slug: "",
  category: "",
  price: 0,
  compareAt: null,
  colors: [],
  fit: "",
  images: [],
  inventory: [],
  status: "",
  active: true,
  sortOrder: 0,
}

type FormErrors = Partial<Record<"name" | "category" | "price" | "compareAt" | "images" | "inventory", string>>

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  categories: Array<{ id: string; name: string }>
  colors: Array<{ id: string; name: string; hex: string }>
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading?: boolean
  isNew?: boolean
}

export function ProductForm({
  initialData: initialDataProp,
  categories,
  colors,
  onSubmit,
  isLoading = false,
  isNew = true,
}: ProductFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>({
    ...initialData,
    ...initialDataProp,
    images: initialDataProp?.images ?? initialData.images,
    inventory: initialDataProp?.inventory ?? initialData.inventory,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const busy = isLoading || submitting

  function handleChange<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  /**
   * Distinct colors taken from the gallery, in first-appearance order. Color
   * names are compared case-insensitively so "Black" and "black" are one color.
   */
  const galleryColors = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string }>()
    for (const image of formData.images) {
      const name = image.color.trim()
      if (!name) continue
      const key = name.toLowerCase()
      if (!seen.has(key)) seen.set(key, { name, hex: image.colorHex || "#000000" })
    }
    return [...seen.values()]
  }, [formData.images])

  // Inventory rows for colors that are no longer in the gallery are hidden and
  // dropped when the inventory section changes or the form is saved.
  const activeInventory = useMemo(() => {
    const keys = new Set(galleryColors.map((color) => color.name.toLowerCase()))
    return formData.inventory.filter((item) => keys.has(item.color.trim().toLowerCase()))
  }, [formData.inventory, galleryColors])

  function validate(): boolean {
    const next: FormErrors = {}

    if (!formData.name.trim()) next.name = "Name is required."
    if (!formData.category) next.category = "Category is required."
    if (!formData.price || formData.price <= 0) next.price = "Price must be greater than 0."
    if (formData.compareAt && formData.compareAt <= formData.price) {
      next.compareAt = "Compare at price must be higher than the price."
    }

    // Images: at least one, every image linked to a color, valid HEX codes.
    if (formData.images.length === 0) {
      next.images = "Add at least one image."
    } else if (formData.images.some((image) => !image.color.trim())) {
      next.images = "Every image must be linked to a color."
    } else {
      const invalidHex = formData.images.find(
        (image) => !/^#[0-9a-f]{6}$/i.test(image.colorHex.trim()),
      )
      if (invalidHex) {
        next.images = `"${invalidHex.colorHex}" is not a valid HEX code. Use the format #000000.`
      }
    }

    // Inventory: every color needs sizes, quantities are whole numbers >= 0,
    // and a size cannot repeat within a color.
    if (!next.images && galleryColors.length === 0) {
      next.images = "Link at least one image to a color."
    }

    const inventoryProblem = validateInventory(galleryColors, activeInventory)
    if (inventoryProblem) next.inventory = inventoryProblem

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    // Canonical color casing comes from the gallery, so inventory rows and
    // images always use the same spelling.
    const canonical = new Map<string, string>()
    for (const color of galleryColors) canonical.set(color.name.toLowerCase(), color.name)

    const mainIndex = Math.max(
      0,
      formData.images.findIndex((image) => image.isMain),
    )
    const images: AdminProductImage[] = formData.images.map((image, index) => ({
      ...image,
      color: canonical.get(image.color.trim().toLowerCase()) ?? image.color.trim(),
      colorHex: image.colorHex.toUpperCase(),
      order: index,
      isMain: index === mainIndex,
    }))

    const inventory: AdminInventoryItem[] = activeInventory.map((item) => ({
      ...item,
      color: canonical.get(item.color.trim().toLowerCase()) ?? item.color.trim(),
      colorHex: galleryColors.find(
        (color) => color.name.toLowerCase() === item.color.trim().toLowerCase(),
      )?.hex,
      quantity: Math.max(0, Math.trunc(Number(item.quantity) || 0)),
    }))

    // Keep the legacy CMS color relationships in sync with the gallery colors.
    const colorIds = galleryColors
      .map((color) => colors.find((option) => option.name.toLowerCase() === color.name.toLowerCase())?.id)
      .filter((id): id is string => Boolean(id))

    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        images,
        inventory,
        colors: colorIds,
      })
      router.push("/manage/products")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const errorList = Object.values(errors).filter(Boolean) as string[]
  const discount = formData.compareAt
    ? Math.round((1 - formData.price / formData.compareAt) * 100)
    : 0
  const totalStock = activeInventory.reduce((sum, item) => sum + Math.max(0, item.quantity), 0)

  return (
    <form onSubmit={handleSubmit} className="admin-form" noValidate>
      {errorList.length > 0 && (
        <div className="admin-form-error-summary" role="alert">
          <strong>Please fix the following before saving:</strong>
          <ul>
            {errorList.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Info */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Basic Information</h2>

        <div className="admin-field">
          <label htmlFor="name" className="admin-field-label">Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={cn("admin-field-input", errors.name && "error")}
            placeholder="Product name"
            required
            disabled={busy}
          />
          {errors.name && <span className="admin-field-error">{errors.name}</span>}
        </div>

        <div className="admin-field">
          <label htmlFor="slug" className="admin-field-label">Slug</label>
          <input
            id="slug"
            type="text"
            value={formData.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            className="admin-field-input"
            placeholder="auto-generated from name"
            disabled={busy}
          />
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            Leave empty to auto-generate from name
          </p>
        </div>

        <div className="admin-field">
          <label htmlFor="category" className="admin-field-label">Category *</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className={cn("admin-field-select", errors.category && "error")}
            required
            disabled={busy}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <span className="admin-field-error">{errors.category}</span>}
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="price" className="admin-field-label">Price (DA) *</label>
            <input
              id="price"
              type="number"
              min="0"
              step="100"
              value={formData.price}
              onChange={(e) => handleChange("price", Number(e.target.value) || 0)}
              className={cn("admin-field-input", errors.price && "error")}
              required
              disabled={busy}
            />
            {errors.price && <span className="admin-field-error">{errors.price}</span>}
          </div>

          <div className="admin-field">
            <label htmlFor="compareAt" className="admin-field-label">Compare At Price (DA)</label>
            <input
              id="compareAt"
              type="number"
              min="0"
              step="100"
              value={formData.compareAt || ""}
              onChange={(e) => handleChange("compareAt", e.target.value ? Number(e.target.value) : null)}
              className={cn("admin-field-input", errors.compareAt && "error")}
              disabled={busy}
            />
            {formData.compareAt && formData.compareAt > formData.price && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-red)" }}>
                Sale: {discount}% off
              </p>
            )}
            {errors.compareAt && <span className="admin-field-error">{errors.compareAt}</span>}
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="fit" className="admin-field-label">Fit</label>
            <select
              id="fit"
              value={formData.fit}
              onChange={(e) => handleChange("fit", e.target.value)}
              className="admin-field-select"
              disabled={busy}
            >
              <option value="">Select fit</option>
              {FIT_OPTIONS.map((fit) => (
                <option key={fit} value={fit}>
                  {fit}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="sortOrder" className="admin-field-label">Sort Order</label>
            <input
              id="sortOrder"
              type="number"
              min="0"
              step="1"
              value={formData.sortOrder}
              onChange={(e) => handleChange("sortOrder", Number(e.target.value) || 0)}
              className="admin-field-input"
              disabled={busy}
            />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Images</h2>
        <p className="admin-section-hint">
          Upload as many photos as you like, then link each one to a color. Use the arrows to
          reorder and the radio button to pick the main image. Photos with the same color form one
          colorway gallery.
        </p>

        <ProductImagesManager
          value={formData.images}
          onChange={(images) => handleChange("images", images)}
          colorOptions={colors.map((color) => ({ name: color.name, hex: color.hex }))}
          disabled={busy}
          error={errors.images}
        />
        {errors.images && <span className="admin-field-error">{errors.images}</span>}
      </section>

      {/* Sizes & stock per color */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Sizes &amp; Stock</h2>
        <p className="admin-section-hint">
          Every color from your gallery gets its own sizes. Set the available quantity for each
          color and size — 0 means out of stock. You can add custom sizes like 38, 40 or 42.
        </p>

        {galleryColors.length > 0 && (
          <p className="admin-inventory-summary">
            {galleryColors.length} {galleryColors.length === 1 ? "color" : "colors"} ·{" "}
            {activeInventory.length} {activeInventory.length === 1 ? "size" : "size rows"} ·{" "}
            {totalStock} in stock
          </p>
        )}

        <ProductInventoryManager
          colors={galleryColors}
          value={activeInventory}
          onChange={(inventory) => handleChange("inventory", inventory)}
          disabled={busy}
          error={errors.inventory}
        />
      </section>

      {/* Status & Visibility */}
      <section className="admin-form-section">
        <h2 className="admin-form-section-title">Status & Visibility</h2>

        <div className="admin-field">
          <label htmlFor="status" className="admin-field-label">Badge</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value as ProductFormData["status"])}
            className="admin-field-select"
            disabled={busy}
          >
            <option value="">None</option>
            <option value="new">New</option>
            <option value="sale">Sale</option>
            <option value="soldout">Sold Out</option>
          </select>
        </div>

        <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-3)" }}>
          <input
            id="active"
            type="checkbox"
            checked={formData.active}
            onChange={(e) => handleChange("active", e.target.checked)}
            style={{ width: "1.25rem", height: "1.25rem" }}
            disabled={busy}
          />
          <label htmlFor="active" className="admin-field-label" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            Visible on storefront
          </label>
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "var(--space-6)", borderTop: "1px solid var(--admin-border)" }}>
        <a href="/manage/products" className="admin-btn admin-btn-secondary">
          Cancel
        </a>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving..." : isNew ? "Create Product" : "Update Product"}
        </button>
      </div>
    </form>
  )
}

/**
 * Checks the inventory rows for one or more colors and returns the first clear
 * error message, or null when everything is valid.
 */
function validateInventory(
  colors: Array<{ name: string }>,
  inventory: AdminInventoryItem[],
): string | null {
  if (colors.length === 0) return null

  for (const color of colors) {
    const items = inventory.filter(
      (item) => item.color.trim().toLowerCase() === color.name.toLowerCase(),
    )

    if (items.length === 0) return `Add at least one size for ${color.name}.`

    const seen = new Set<string>()
    for (const item of items) {
      const size = item.size.trim().toLowerCase()
      if (seen.has(size)) return `"${item.size}" is added twice for ${color.name}.`
      seen.add(size)

      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity < 0) {
        return `Quantity for ${color.name} / ${item.size} must be a whole number of 0 or more.`
      }
    }
  }

  return null
}
