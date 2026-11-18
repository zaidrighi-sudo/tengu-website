"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, refreshStorefront, type LeanOrder, type PaginatedResult } from "./_shared"
import { Order } from "@/lib/mongodb/models"

export async function getOrders(page = 1, limit = 20, search = "", status = ""): Promise<PaginatedResult<LeanOrder>> {
  await ensureDB()

  const query: Record<string, unknown> = {}

  if (search) {
    query.$or = [
      { number: { $regex: search, $options: "i" } },
      { "customer.firstName": { $regex: search, $options: "i" } },
      { "customer.lastName": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ]
  }

  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "email").lean(),
    Order.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanOrder[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getOrder(id: string): Promise<LeanOrder | null> {
  await ensureDB()
  return Order.findById(id).populate("user", "email").populate("lines.product", "name slug").lean() as unknown as LeanOrder | null
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureDB()
  const result = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
  revalidatePath("/manage/orders")
  revalidatePath("/manage/dashboard")
  return result
}

export async function updateOrder(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const result = await Order.findByIdAndUpdate(id, data, { new: true })
  revalidatePath("/manage/orders")
  revalidatePath("/manage/dashboard")
  return result
}

// Customers (Users)
