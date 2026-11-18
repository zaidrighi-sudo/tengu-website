"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, toObjectId, type LeanColor, type PaginatedResult } from "./_shared"
import { Color } from "@/lib/mongodb/models"

export async function getColors(): Promise<LeanColor[]> {
  await ensureDB()
  return Color.find({ isActive: true }).sort({ sortOrder: 1 }).lean() as unknown as LeanColor[]
}

export async function getColorsPaginated(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanColor>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Color.find(query).sort({ sortOrder: 1 }).skip(skip).limit(limit).lean(),
    Color.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanColor[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getColor(id: string): Promise<LeanColor | null> {
  await ensureDB()
  return Color.findById(id).lean() as unknown as LeanColor | null
}

export async function createColor(data: Record<string, unknown>) {
  await ensureDB()
  const result = await Color.create(data)
  revalidatePath("/manage/colors")
  return result
}

export async function updateColor(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const result = await Color.findByIdAndUpdate(id, data, { new: true })
  revalidatePath("/manage/colors")
  return result
}

export async function deleteColor(id: string) {
  await ensureDB()
  await Color.findByIdAndDelete(id)
  revalidatePath("/manage/colors")
}