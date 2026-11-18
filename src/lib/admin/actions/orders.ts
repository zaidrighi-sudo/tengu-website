"use server"

import { revalidatePath } from "next/cache"
import { ensureDB, type LeanOrder, type PaginatedResult } from "./_shared"
import { Order, Product } from "@/lib/mongodb/models"

const ORDER_STATUSES = new Set(["new", "confirmed", "shipped", "delivered", "cancelled", "returned"])
/** Statuses whose goods are physically back with the seller. */
const RESTOCK_STATUSES = new Set(["cancelled", "returned"])

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

type ExistingLine = {
  product?: unknown
  name?: string
  color?: string
  size?: string
  qty?: number
}

type OrderContext = {
  status: string
  number: string
  lines?: ExistingLine[]
}

/** Status + lines of an order before a patch, for inventory adjustment. */
async function loadOrderContext(id: string): Promise<OrderContext | null> {
  const existing = (await Order.findById(id).select("status number lines").lean()) as unknown as OrderContext | null
  return existing
}

/**
 * Gives (or takes) the order's variant quantities in response to a status
 * transition into/out of the restock statuses. Never throws: a stale or
 * missing variant is logged and skipped so it cannot block the status save.
 */
async function applyStatusTransition(existing: OrderContext, next: string) {
  const wasRestocked = RESTOCK_STATUSES.has(existing.status)
  const willRestock = RESTOCK_STATUSES.has(next)
  if (willRestock === wasRestocked) return
  await adjustLines(existing.lines, existing.number, willRestock ? +1 : -1)
}

/**
 * Adjusts `inventory.$.quantity` for every line of an order.
 * sign=+1 gives the goods back to stock; sign=-1 takes them out again.
 * Quantity-guarded in the deduct direction only; unmatched variants are
 * logged and skipped so one stale line never blocks the rest.
 */
async function adjustLines(lines: readonly ExistingLine[] | undefined, orderNumber: string, sign: 1 | -1) {
  for (const line of lines ?? []) {
    const qty = Math.floor(Number(line?.qty) || 0)
    if (qty <= 0) continue
    const productRef = line.product as { _id?: unknown } | string | undefined
    const product =
      typeof productRef === "object" && productRef?._id ? productRef._id : productRef
    if (!product) continue

    const color = line.color ?? ""
    const size = line.size ?? ""
    const filter =
      sign === -1
        ? {
            _id: product,
            inventory: {
              $elemMatch: { color, size, quantity: { $gte: qty } },
            },
          }
        : {
            _id: product,
            inventory: { $elemMatch: { color, size } },
          }

    const result = await Product.updateOne(filter, {
      $inc: { "inventory.$.quantity": sign * qty },
    }).catch(() => null)
    if (!result || result.modifiedCount === 0) {
      console.warn(
        `[orders] stock ${sign === 1 ? "restore" : "deduct"} skipped: ${qty}x ${line.name ?? "item"} (${color} / ${size}) on order ${orderNumber}`,
      )
    }
  }
}

export async function updateOrderStatus(id: string, status: string) {
  await ensureDB()
  if (!ORDER_STATUSES.has(status)) throw new Error(`Invalid order status: ${status}`)

  const existing = await loadOrderContext(id)
  if (!existing) return null

  const result = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
  if (!result) return null
  await applyStatusTransition(existing, status)
  revalidatePath("/manage/orders")
  revalidatePath("/manage/dashboard")
  return result
}

export async function updateOrder(id: string, data: Record<string, unknown>) {
  await ensureDB()

  let existing: OrderContext | null = null
  if (data && typeof data.status === "string") {
    if (!ORDER_STATUSES.has(data.status)) throw new Error(`Invalid order status: ${data.status}`)
    existing = await loadOrderContext(id)
  }

  const result = await Order.findByIdAndUpdate(id, data, { new: true })
  if (result && existing) await applyStatusTransition(existing, data.status as string)
  revalidatePath("/manage/orders")
  revalidatePath("/manage/dashboard")
  return result
}
