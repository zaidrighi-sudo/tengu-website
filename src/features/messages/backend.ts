"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, type LeanMessage, type PaginatedResult } from "@/features/admin/actions-shared"
import { connectDB, Message } from "@/shared/mongodb/models"
import { type ActionFailure, text, failure } from "@/shared/storefront-actions"

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
export type SendMessageInput = {
  name: string
  email: string
  topic: string
  orderNumber: string
  message: string
}

export async function sendMessage(input: SendMessageInput): Promise<{ ok: true } | ActionFailure> {
  try {
    await connectDB()
    await Message.create({
      name: text(input?.name, 120),
      email: text(input?.email, 200),
      topic: text(input?.topic, 80),
      orderNumber: text(input?.orderNumber, 40),
      message: text(input?.message, 4000),
      status: 'new',
    })
    return { ok: true }
  } catch (error) {
    return failure(error, 'We could not send your message. Please try again.')
  }
}
