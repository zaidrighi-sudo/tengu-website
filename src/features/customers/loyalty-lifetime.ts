import 'server-only'

import mongoose from 'mongoose'
import { connectDB, Order, type IOrder } from '@/shared/mongodb/models'
import { toStoreUser } from '@/features/customers/app-user'
import type { AppUser } from '@/features/auth/app-auth'
import type { User } from '@/features/auth/AuthContext'

/**
 * Total DA a customer has spent on *delivered* orders.
 *
 * Cancelled and returned orders collected nothing, so they do not count toward
 * the lifetime-spend loyalty reward. Computed on demand — no counters to drift.
 */
export async function getLifetimeDeliveredSpend(userId: string): Promise<number> {
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) return 0
  try {
    await connectDB()
    const agg = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: 'delivered' as IOrder['status'] } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])
    return Math.max(0, Number(agg[0]?.total ?? 0) || 0)
  } catch (error) {
    console.error('Could not compute lifetime delivered spend:', error)
    return 0
  }
}

/** Hydrate the storefront user shape, attaching the lifetime delivered spend. */
export async function toStoreUserWithSpend(user: AppUser): Promise<User> {
  const lifetimeSpent = await getLifetimeDeliveredSpend(user.id)
  return toStoreUser(user, lifetimeSpent)
}
