"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, toObjectId, slugify, type LeanCategory, type PaginatedResult } from "./_shared"
import { Category } from "@/lib/mongodb/models"

export async function getCategories(): Promise<LeanCategory[]> {
  await ensureDB()
  return Category.find().sort({ sortOrder: 1 }).lean() as unknown as LeanCategory[]
}

export async function getCategoriesPaginated(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanCategory>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Category.find(query).sort({ sortOrder: 1 }).skip(skip).limit(limit).populate("tileImage", "url").populate("tileHoverImage", "url").lean(),
    Category.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanCategory[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getCategory(id: string): Promise<LeanCategory | null> {
  await ensureDB()
  return Category.findById(id).populate("tileImage", "url").populate("tileHoverImage", "url").lean() as unknown as LeanCategory | null
}

export async function createCategory(data: Record<string, unknown>) {
  await ensureDB()
  const name = String(data.name ?? '').trim()
  if (!name) throw new Error('Category name is required.')
  const categoryData = {
    ...data,
    name,
    slug: data.slug ? String(data.slug) : slugify(name),
    sortOrder: Number(data.sortOrder) || 0,
    tileImage: data.tileImage ? toObjectId(data.tileImage as string) : undefined,
    tileHoverImage: data.tileHoverImage ? toObjectId(data.tileHoverImage as string) : undefined,
    sizeChart: data.sizeChart ? JSON.parse(data.sizeChart as string) : undefined,
  }
  const result = await Category.create(categoryData)
  revalidatePath("/manage/categories")
  refreshStorefront()
  return result
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const updateData: Record<string, unknown> = {
    ...data,
    sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
    tileImage: data.tileImage ? toObjectId(data.tileImage as string) : (data.tileImage === null ? null : undefined),
    tileHoverImage: data.tileHoverImage ? toObjectId(data.tileHoverImage as string) : (data.tileHoverImage === null ? null : undefined),
    sizeChart: data.sizeChart !== undefined ? (data.sizeChart ? JSON.parse(data.sizeChart as string) : []) : undefined,
  }
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key]
  })
  const result = await Category.findByIdAndUpdate(id, updateData, { new: true })
  revalidatePath("/manage/categories")
  refreshStorefront()
  return result
}

export async function deleteCategory(id: string) {
  await ensureDB()
  await Category.findByIdAndDelete(id)
  revalidatePath("/manage/categories")
  refreshStorefront()
}