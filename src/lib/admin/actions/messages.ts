"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, type LeanMessage, type PaginatedResult } from "./_shared"
import { Message } from "@/lib/mongodb/models"

export async function getMessages(page = 1, limit = 20, search = "", status = ""): Promise<PaginatedResult<LeanMessage>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { topic: { $regex: search, $options: "i" } },
    ]
  }
  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanMessage[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function updateMessageStatus(id: string, status: string) {
  await ensureDB()
  const result = await Message.findByIdAndUpdate(id, { status }, { new: true })
  revalidatePath("/manage/messages")
  return result
}