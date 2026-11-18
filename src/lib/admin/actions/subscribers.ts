"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, type LeanSubscriber, type PaginatedResult } from "./_shared"
import { Subscriber } from "@/lib/mongodb/models"

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
