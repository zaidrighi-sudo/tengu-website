"use server"

import { ensureDB } from "@/features/admin/actions-shared"
import { Order, User, Product } from "@/shared/mongodb/models"

export async function getDashboardStats() {
  await ensureDB()

  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    salesDataRaw,
  ] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments({ status: "new" }),
    Product.countDocuments({ active: false }),
    Order.find().sort({ createdAt: -1 }).limit(10).populate("user", "email").lean(),
    Order.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      // Revenue trend counts only money that was actually collected.
      status: { $nin: ["cancelled", "returned"] },
    }).sort({ createdAt: 1 }).select("total createdAt status").lean(),
  ])

  // Calculate total revenue: cancelled or returned orders collected nothing.
  // One pass gives revenue + order count (for AOV); a second distinct() pass
  // gives the number of unique buyer phones (for LTV).
  const revenueAgg = await Order.aggregate([
    { $match: { status: { $nin: ["cancelled", "returned"] } } },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
  ])
  const totalRevenue = revenueAgg[0]?.total || 0
  const collectedOrders = revenueAgg[0]?.count || 0
  const avgOrderValue = collectedOrders > 0 ? Math.round(totalRevenue / collectedOrders) : 0
  const buyerPhones = await Order.distinct("customer.phone", {
    status: { $nin: ["cancelled", "returned"] },
    "customer.phone": { $nin: [null, ""] },
  })
  const ltv = buyerPhones.length > 0 ? Math.round(totalRevenue / buyerPhones.length) : 0

  // Outcome split across every order, recorded after the confirmation call:
  // completed (delivered & paid), returned (came back), annulled (cancelled).
  const outcomesAgg = await Order.aggregate([
    { $match: { status: { $in: ["delivered", "returned", "cancelled"] } } },
    { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$total" } } },
  ])
  const outcomes = (["delivered", "returned", "cancelled"] as const).reduce(
    (acc, key) => {
      const hit = (outcomesAgg as Array<{ _id: string; count: number; value: number }>).find((row) => row._id === key)
      acc[key] = { count: hit?.count ?? 0, value: hit?.value ?? 0 }
      return acc
    },
    {} as Record<"delivered" | "returned" | "cancelled", { count: number; value: number }>,
  )

  // Process sales data by day
  const salesByDay = new Map<string, { revenue: number; orders: number }>()
  for (const order of salesDataRaw) {
    const date = new Date(order.createdAt).toISOString().split("T")[0]
    const existing = salesByDay.get(date) || { revenue: 0, orders: 0 }
    existing.revenue += order.total || 0
    existing.orders += 1
    salesByDay.set(date, existing)
  }

  // Fill in the trailing 30 days so charts render a continuous series.
  // `date` stays machine-readable (ISO); the client formats for display.
  const salesData: Array<{ date: string; revenue: number; orders: number }> = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    salesData.push({
      date: dateStr,
      revenue: salesByDay.get(dateStr)?.revenue || 0,
      orders: salesByDay.get(dateStr)?.orders || 0,
    })
  }

  // Format recent orders
  const formattedRecentOrders = recentOrders.map((order: any) => ({
    id: order._id.toString(),
    number: order.number,
    customer: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || order.user?.email || "Guest",
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }))

  // Cancellation rate across resolved orders (delivered + returned + annulled).
  const resolvedTotal = outcomes.delivered.count + outcomes.returned.count + outcomes.cancelled.count
  const cancelRate = resolvedTotal > 0 ? Math.round((outcomes.cancelled.count / resolvedTotal) * 100) : null

  return {
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    recentOrders: formattedRecentOrders,
    salesData,
    outcomes,
    avgOrderValue,
    ltv,
    cancelRate,
  }
}
