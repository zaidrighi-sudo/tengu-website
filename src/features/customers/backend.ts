"use server"

import mongoose from 'mongoose'
import { revalidatePath } from "next/cache"
import { ensureDB, toObjectId, type LeanUser, type PaginatedResult } from "@/features/admin/actions-shared"
import { Order, User, type IOrder } from "@/shared/mongodb/models"

export async function getCustomers(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanUser>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ]
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanUser[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

/**
 * Lifetime delivered spend (DA) per customer, in one aggregate. Used by the
 * customers list to show loyalty-reward progress; cancelled and returned
 * orders collected nothing, so they never count.
 */
export async function getLifetimeDeliveredSpendForUsers(ids: string[]): Promise<Record<string, number>> {
  await ensureDB()
  const valid = ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
  if (valid.length === 0) return {}
  const rows = await Order.aggregate([
    {
      $match: {
        user: { $in: valid.map((id) => new mongoose.Types.ObjectId(id)) },
        status: 'delivered' as IOrder['status'],
      },
    },
    { $group: { _id: '$user', total: { $sum: '$total' } } },
  ])
  const out: Record<string, number> = {}
  for (const row of rows) {
    const total = Number(row?.total)
    if (Number.isFinite(total) && row?._id) out[String(row._id)] = Math.max(0, total)
  }
  return out
}

export async function getCustomer(id: string): Promise<LeanUser | null> {
  await ensureDB()
  return User.findById(id).lean() as unknown as LeanUser | null
}

export async function updateCustomer(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const result = await User.findByIdAndUpdate(id, data, { new: true })
  revalidatePath("/manage/customers")
  return result
}
