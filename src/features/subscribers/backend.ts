"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, type LeanSubscriber, type PaginatedResult } from "@/features/admin/actions-shared"
import { connectDB, Subscriber } from "@/shared/mongodb/models"
import { type ActionFailure, text, failure } from "@/shared/storefront-actions"

export async function getSubscribers(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanSubscriber>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.email = { $regex: search, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscriber.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanSubscriber[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function deleteSubscriber(id: string) {
  await ensureDB()
  await Subscriber.findByIdAndDelete(id)
  revalidatePath("/manage/subscribers")
}

export async function subscribe(input: { email: string; language: string }): Promise<{ ok: true } | ActionFailure> {
  const email = text(input?.email, 200).trim().toLowerCase()
  try {
    await connectDB()
    const existing = await Subscriber.findOne({ email })
    // Joining twice is not an error for the visitor.
    if (existing) return { ok: true }
    await Subscriber.create({
      email,
      language: input?.language === 'fr' || input?.language === 'ar' ? input.language : 'en',
    })
    return { ok: true }
  } catch (error) {
    return failure(error, 'Enter a valid email address.')
  }
}
