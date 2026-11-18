'use server'

import mongoose from 'mongoose'
import { connectDB, Order, Message, Subscriber, Product } from '@/lib/mongodb/models'
import { appAuth } from '@/lib/app-auth'
import { computeDelivery } from '@/lib/delivery'
import { getLifetimeDeliveredSpend } from '@/lib/loyalty-lifetime'
import { revalidatePath } from 'next/cache'

type FieldErrors = Record<string, string>
export type ActionFailure = { ok: false; error: string; fieldErrors: FieldErrors }

export type PlaceOrderInput = {
  lines: { productId: string; size: string; color?: string; qty: number }[]
  firstName: string
  lastName: string
  phone: string
  wilaya: string
  commune: string
  address1: string
  address2: string
  method: 'home' | 'desk'
  note: string
}

export type PlaceOrderResult =
  | {
      ok: true
      order: {
        number: string
        placedAt: string
        subtotal: number
        shipping: number
        total: number
        deliveryDays: string
        lines: { id: string; name: string; color: string; size: string; qty: number; price: number }[]
      }
    }
  | ActionFailure

/** Map field paths to the storefront's form field ids. */
const FIELD_IDS: Record<string, string> = {
  'customer.firstName': 'ship-firstName',
  'customer.lastName': 'ship-lastName',
  'customer.phone': 'ship-phone',
  'address.wilaya': 'ship-region',
  'address.commune': 'ship-city',
  'address.street': 'ship-address1',
  email: 'contact-email',
  name: 'contact-name',
  topic: 'contact-topic',
  orderNumber: 'contact-order',
  message: 'contact-message',
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '')

function failure(error: unknown, fallback: string): ActionFailure {
  const issues: { path?: string; message?: string }[] =
    (error as { data?: { errors?: { path?: string; message?: string }[] } })?.data?.errors ?? []
  const fieldErrors: FieldErrors = {}
  for (const issue of issues) {
    if (!issue.message) continue
    const id = issue.path ? (FIELD_IDS[issue.path] ?? issue.path) : 'form'
    fieldErrors[id] ??= issue.message
  }
  const first = Object.values(fieldErrors)[0]
  return { ok: false, error: first ?? fallback, fieldErrors }
}

type OrderProduct = {
  _id: { toString(): string }
  price: number
  name: string
  status?: string
  sizes?: string[]
  inventory?: Array<{ color: string; size: string; quantity: number }>
}

type RequestedLine = {
  product: OrderProduct
  productId: string
  size: string
  color: string
  qty: number
  tracked: boolean
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const rawLines = Array.isArray(input?.lines) ? input.lines.slice(0, 50) : []
  const customer = await appAuth.currentUser()
  if (!customer) return { ok: false, error: 'Please sign in to place an order.', fieldErrors: {} }

  try {
    await connectDB()

    // Collapse duplicate variant lines and reject malformed quantities.
    const requested = new Map<string, { productId: string; size: string; color: string; qty: number }>()
    for (const line of rawLines) {
      const productId = text(line?.productId, 64).trim()
      const size = text(line?.size, 40).trim()
      const color = text(line?.color, 80).trim()
      const qty = Math.floor(Number(line?.qty))
      if (!productId || !size || !Number.isFinite(qty) || qty < 1 || qty > 9) {
        return { ok: false, error: 'Some items in your bag are invalid. Please review your bag.', fieldErrors: {} }
      }
      const key = `${productId}\u0000${size}\u0000${color}`
      const existing = requested.get(key)
      requested.set(key, existing ? { ...existing, qty: existing.qty + qty } : { productId, size, color, qty })
    }

    const entries = [...requested.values()]
    if (entries.length === 0) {
      return { ok: false, error: 'Your bag is empty.', fieldErrors: {} }
    }

    // Fetch product details for pricing and stock.
    const productIds = [...new Set(entries.map((line) => line.productId))]
    const products = await Product.find({ _id: { $in: productIds } }).lean() as unknown as OrderProduct[]
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const lines: RequestedLine[] = []
    for (const entry of entries) {
      const product = productMap.get(entry.productId)
      if (!product) {
        return { ok: false, error: 'One of the items in your bag is no longer available.', fieldErrors: {} }
      }
      if (product.status === 'soldout') {
        return { ok: false, error: `${product.name} is sold out.`, fieldErrors: {} }
      }
      if (product.sizes?.length && !product.sizes.includes(entry.size)) {
        return { ok: false, error: `${product.name} is not available in size ${entry.size}.`, fieldErrors: {} }
      }

      const tracked = Boolean(product.inventory?.length)
      if (tracked) {
        const item = product.inventory?.find(
          (candidate) => candidate.color === entry.color && candidate.size === entry.size,
        )
        if (!item) {
          return {
            ok: false,
            error: `${product.name} is not available in ${entry.color || 'that color'} / ${entry.size}.`,
            fieldErrors: {},
          }
        }
        if (item.quantity < entry.qty) {
          return {
            ok: false,
            error: item.quantity <= 0
              ? `${product.name} (${entry.color} / ${entry.size}) is sold out.`
              : `Only ${item.quantity} left of ${product.name} (${entry.color} / ${entry.size}). Please update your bag.`,
            fieldErrors: {},
          }
        }
      }

      lines.push({
        product,
        productId: entry.productId,
        size: entry.size,
        color: entry.color,
        qty: entry.qty,
        tracked,
      })
    }

    // Deduct stock from the exact color + size variants. If another order takes
    // the last piece in the meantime, undo what this order already reserved.
    const deducted: RequestedLine[] = []
    const restoreStock = async () => {
      for (const done of deducted) {
        await Product.updateOne(
          { _id: done.productId, inventory: { $elemMatch: { color: done.color, size: done.size } } },
          { $inc: { 'inventory.$.quantity': done.qty } },
        ).catch(() => undefined)
      }
    }

    for (const line of lines) {
      if (!line.tracked) continue
      const result = await Product.updateOne(
        {
          _id: line.productId,
          inventory: { $elemMatch: { color: line.color, size: line.size, quantity: { $gte: line.qty } } },
        },
        { $inc: { 'inventory.$.quantity': -line.qty } },
      )
      if (!result.modifiedCount) {
        await restoreStock()
        return {
          ok: false,
          error: `${line.product.name} (${line.color} / ${line.size}) just sold out. Please update your bag.`,
          fieldErrors: {},
        }
      }
      deducted.push(line)
    }

    // Build order lines with the server-side prices.
    const orderLines = lines.map((line) => ({
      product: line.productId,
      name: line.product.name,
      color: line.color,
      size: line.size,
      qty: line.qty,
      unitPrice: line.product.price,
    }))

    // Calculate totals from the delivery settings in the CMS (wilaya/commune + home/desk method).
    const subtotal = orderLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
    const method: 'home' | 'desk' = input?.method === 'desk' ? 'desk' : 'home'
    const wilaya = text(input?.wilaya, 80)
    const commune = text(input?.commune, 120)
    // Lifetime spend on delivered orders — unlocks free home delivery forever
    // once it reaches the CMS loyalty threshold.
    const lifetimeSpent = await getLifetimeDeliveredSpend(customer.id)
    const delivery = await computeDelivery(method, subtotal, wilaya, commune, lifetimeSpent)

    // Loyalty: no points discount anymore — home delivery goes free by lifetime delivered spend (below).
    const discount = 0
    const shippingFee = delivery.fee
    const total = subtotal + shippingFee

    // Order number: date + unambiguous random suffix (no I/L/O/0/1), so
    // concurrent checkouts and re-ships never reuse a number. The `number`
    // field has a unique index; on the off chance of a clash we retry with a
    // fresh suffix instead of failing the customer's checkout.
    const numberChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const numberSuffix = () => {
      const now = new Date()
      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      let random = ''
      for (let i = 0; i < 4; i++) random += numberChars[Math.floor(Math.random() * numberChars.length)]
      return `ORD-${ymd}-${random}`
    }

    // Create order. If it fails, give the reserved stock back.
    let order
    let createError: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await Order.create({
          number: numberSuffix(),
          user: customer.id,
        customer: {
          firstName: text(input?.firstName, 80),
          lastName: text(input?.lastName, 80),
          phone: text(input?.phone, 30),
        },
        address: {
          wilaya,
          commune: text(input?.commune, 120),
          street: text(input?.address1, 240),
          landmark: text(input?.address2, 240),
        },
        deliveryMethod: method,
        deliveryDays: delivery.deliveryDays,
        lines: orderLines,
        subtotal,
        discount,
        shippingFee,
        total,
        status: 'new',
        note: text(input?.note, 240),
        loyaltyFreeDelivery: delivery.loyaltyApplied,
        })
        createError = undefined
        break
      } catch (error) {
        createError = error
        // Only the unique order number is worth retrying; anything else is a
        // real failure.
        const duplicate =
          typeof error === 'object' &&
          error !== null &&
          (error as { code?: number }).code === 11000
        if (!duplicate) break
      }
    }

    // All attempts failed: give the reserved stock back.
    if (!order) {
      await restoreStock()
      throw createError
    }

    return {
      ok: true,
      order: {
        number: order.number,
        placedAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
        subtotal: order.subtotal,
        shipping: order.shippingFee,
        total: order.total,
        deliveryDays: order.deliveryDays ?? '',
        lines: order.lines.map((line: { product: mongoose.Types.ObjectId; name: string; color?: string; size: string; qty: number; unitPrice: number }) => ({
          id: line.product.toString(),
          name: line.name,
          color: line.color ?? '',
          size: line.size,
          qty: line.qty,
          price: line.unitPrice,
        })),
      },
    }
  } catch (error) {
    console.error('Place order error:', error)
    return failure(error, 'We could not place your order. Please try again.')
  }
}

/** One order in the account history, shaped exactly like a locally saved order. */
export type ServerOrder = Omit<
  import('@/store/utils/checkout').Order,
  'sample'
> & { serverBacked: true }

type LeanOrderDoc = {
  number: string
  createdAt?: Date
  lines?: Array<{
    product: { toString(): string }
    name: string
    color?: string
    size: string
    qty: number
    unitPrice: number
  }>
  note?: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  deliveryMethod?: 'home' | 'desk'
  deliveryDays?: string
  customer?: { firstName?: string; lastName?: string; phone?: string }
  address?: { wilaya?: string; commune?: string; street?: string; landmark?: string }
  loyaltyPointsUsed?: number
}

/**
 * The signed-in customer's orders from the database, newest first.
 * The client merges these with its local copies (same device) and dedupes
 * by order number.
 */
export async function getMyOrders(): Promise<
  { ok: true; orders: ServerOrder[] } | { ok: false; error: string }
> {
  const customer = await appAuth.currentUser()
  if (!customer) return { ok: false, error: 'Please sign in to view your orders.' }

  try {
    await connectDB()
    const docs = (await Order.find({ user: customer.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()) as unknown as LeanOrderDoc[]

    const orders: ServerOrder[] = docs.map((doc) => {
      const deliveryDays = doc.deliveryDays ?? ''
      const range = deliveryDays.match(/(\d+)\D+(\d+)/)
      const maxDays = range ? Number(range[2]) : undefined
      return {
        serverBacked: true,
        number: doc.number,
        placedAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
        email: customer.email ?? '',
        lines: (doc.lines ?? []).map((line) => ({
          id: line.product.toString(),
          name: line.name,
          color: line.color ?? '',
          size: line.size,
          qty: line.qty,
          price: line.unitPrice,
          // The client fills images from the local catalog (by id).
          image: '',
        })),
        note: doc.note ?? '',
        subtotal: doc.subtotal,
        shipping: doc.shippingFee,
        tax: 0,
        total: doc.total,
        methodLabel: doc.deliveryMethod === 'desk' ? 'Stop-desk pickup' : 'Home delivery',
        delivery: deliveryDays,
        maxDays,
        address: {
          country: 'DZ',
          postal: '',
          firstName: doc.customer?.firstName ?? '',
          lastName: doc.customer?.lastName ?? '',
          phone: doc.customer?.phone ?? '',
          address1: doc.address?.street ?? '',
          address2: doc.address?.landmark ?? '',
          city: doc.address?.commune ?? '',
          region: doc.address?.wilaya ?? '',
        },
        payment: 'cod' as const,
      }
    })
    return { ok: true, orders }
  } catch (error) {
    console.error('Could not load orders for the account page:', error)
    return { ok: false, error: 'We could not load your orders. Please try again.' }
  }
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