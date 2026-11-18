"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, toObjectId, slugify, buildVariantFields, type LeanProduct, type PaginatedResult } from "@/features/admin/actions-shared"
import { Product } from "@/shared/mongodb/models"

export async function getProducts(page = 1, limit = 20, search = "", category = ""): Promise<PaginatedResult<LeanProduct>> {
  await ensureDB()

  const query: Record<string, unknown> = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ]
  }

  if (category) {
    query.category = category
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("colors", "name hex")
      .populate("image", "url filename")
      .lean(),
    Product.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanProduct[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getProduct(id: string): Promise<LeanProduct | null> {
  await ensureDB()
  return Product.findById(id)
    .populate("category", "name slug")
    .populate("colors", "name hex")
    .populate("image", "url filename")
    .populate("hoverImage", "url filename")
    .populate("images.image", "url filename")
    .lean() as unknown as LeanProduct | null
}

/**
 * Creates a product. If the chosen slug already exists, appends a numeric
 * suffix (-2, -3, ...) until a unique slug is found.
 */
export async function createProduct(data: Record<string, unknown>) {
  await ensureDB()

  const baseSlug = data.slug ? String(data.slug) : slugify(String(data.name ?? ''))

  let slug = baseSlug
  let counter = 2

  // Try creating the product; if the slug is duplicated, append a suffix and retry.
  while (true) {
    // Convert string IDs to ObjectIds where needed and normalize variant data.
    const {
      images: _rawImages,
      inventory: _rawInventory,
      image: rawImage,
      hoverImage: rawHoverImage,
      sizes: rawSizes,
      ...rest
    } = data
    const variantFields = buildVariantFields(data)
    const productData: Record<string, unknown> = {
      ...rest,
      ...variantFields,
      slug,
      category: data.category ? toObjectId(data.category as string) : undefined,
      colors: data.colors ? (data.colors as string[]).map(id => toObjectId(id)) : [],
      price: Number(data.price),
      compareAt: data.compareAt ? Number(data.compareAt) : undefined,
      active: Boolean(data.active),
      sortOrder: Number(data.sortOrder) || 0,
      // Empty strings are not valid enum values: omit the field instead.
      fit: data.fit ? String(data.fit) : undefined,
      status: data.status ? String(data.status) : undefined,
    }
    if (variantFields.image === undefined && rawImage) {
      productData.image = toObjectId(String(rawImage))
    }
    if (variantFields.hoverImage === undefined && rawHoverImage) {
      productData.hoverImage = toObjectId(String(rawHoverImage))
    }
    if (variantFields.sizes === undefined) {
      productData.sizes = Array.isArray(rawSizes) ? rawSizes : undefined
    }

    try {
      const result = await Product.create(productData)
      revalidatePath("/manage/products")
      revalidatePath("/manage/dashboard")
      refreshStorefront()
      return result
    } catch (error: any) {
      // MongoDB E11000 duplicate key error on the slug index
      if (error?.code === 11000 && error?.keyPattern?.slug) {
        slug = `${baseSlug}-${counter}`
        counter += 1
        if (counter > 100) throw new Error('Could not generate a unique slug. Please try a different product name.')
        continue
      }
      throw error
    }
  }
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  await ensureDB()

  const {
    images: _rawImages,
    inventory: _rawInventory,
    image: rawImage,
    hoverImage: rawHoverImage,
    sizes: rawSizes,
    ...rest
  } = data
  const variantFields = buildVariantFields(data)
  const updateData: Record<string, unknown> = {
    ...rest,
    ...variantFields,
    category: data.category ? toObjectId(data.category as string) : undefined,
    colors: data.colors ? (data.colors as string[]).map(id => toObjectId(id)) : undefined,
    price: data.price !== undefined ? Number(data.price) : undefined,
    compareAt: data.compareAt !== undefined ? (data.compareAt ? Number(data.compareAt) : null) : undefined,
    active: data.active !== undefined ? Boolean(data.active) : undefined,
    sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
    // Clearing the select means "no fit"/"no badge", not the empty string.
    fit: data.fit !== undefined ? (data.fit ? String(data.fit) : null) : undefined,
    status: data.status !== undefined ? (data.status ? String(data.status) : null) : undefined,
  }
  if (variantFields.image === undefined && rawImage !== undefined) {
    updateData.image = rawImage ? toObjectId(String(rawImage)) : null
  }
  if (variantFields.hoverImage === undefined && rawHoverImage !== undefined) {
    updateData.hoverImage = rawHoverImage ? toObjectId(String(rawHoverImage)) : null
  }
  if (variantFields.sizes === undefined && rawSizes !== undefined) {
    updateData.sizes = rawSizes
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key]
  })
  // Keep the existing slug when the field is cleared on the edit form.
  if (updateData.slug === '') delete updateData.slug

  const result = await Product.findByIdAndUpdate(id, updateData, { new: true })
  revalidatePath("/manage/products")
  revalidatePath("/manage/dashboard")
  refreshStorefront()
  return result
}

export async function deleteProduct(id: string) {
  await ensureDB()
  await Product.findByIdAndDelete(id)
  revalidatePath("/manage/products")
  revalidatePath("/manage/dashboard")
  refreshStorefront()
}