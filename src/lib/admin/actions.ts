"use server"

import mongoose from 'mongoose'
import { connectDB } from "@/lib/mongodb/models"
import {
  Product, Category, Order, User, Color,
  Message, Subscriber, SiteSettings, DeliverySettings, Media,
  type IProduct, type ICategory, type IOrder, type IUser, type IColor,
  type IMessage, type ISubscriber, type ISiteSettings, type IDeliverySettings
} from "@/lib/mongodb/models"
import { redirect } from "next/navigation"
import { revalidatePath, revalidateTag } from "next/cache"
import { adminAuth } from "@/lib/admin-auth"
import { DEFAULT_WILAYAS, DEFAULT_ZONES, KNOWN_COMMUNES, communeKey } from "@/lib/algeria-data"
import { resolveZoneFees } from "@/lib/delivery"

/** Storefront data is cached with this tag; admin edits must expire it. */
const STORE_TAG = "store-data"

function refreshStorefront() {
  revalidateTag(STORE_TAG, "max")
}

// Lean types (plain objects returned by .lean())
// Since we always populate these fields in queries, they are objects not unions
export type LeanProduct = Omit<IProduct, 'category' | 'colors' | 'image' | 'hoverImage' | 'images' | 'inventory'> & {
  _id: string
  category?: { _id: string; name: string; slug: string }
  colors?: Array<{ _id: string; name: string; hex: string }>
  image?: { _id: string; url: string; filename: string }
  hoverImage?: { _id: string; url: string; filename: string }
  images?: Array<{
    image?: { _id: string; url: string; filename: string }
    color: string
    colorHex?: string
    order: number
    isMain: boolean
  }>
  inventory?: Array<{ color: string; colorHex?: string; size: string; quantity: number }>
}

type VariantImageInput = {
  mediaId?: string
  image?: string
  color?: string
  colorHex?: string
  isMain?: boolean
  order?: number
}

type InventoryInput = {
  color?: string
  colorHex?: string
  size?: string
  quantity?: number
}

/**
 * Turns the admin form's variant payload into database fields: a normalized
 * image gallery (exactly one main image, ordered) and color+size inventory.
 * Also derives the legacy `image`/`hoverImage`/`sizes` fields other parts of
 * the app still read.
 */
function buildVariantFields(data: Record<string, unknown>) {
  const rawImages = Array.isArray(data.images) ? (data.images as VariantImageInput[]) : []
  const images = rawImages
    .map((item, index) => ({
      image: String(item?.mediaId ?? item?.image ?? '').trim(),
      color: String(item?.color ?? '').trim(),
      colorHex: item?.colorHex,
      order: Number.isFinite(Number(item?.order)) ? Number(item?.order) : index,
      isMain: Boolean(item?.isMain),
    }))
    .filter((item) => item.image && item.color)
    .sort((a, b) => a.order - b.order)

  if (images.length > 0) {
    const mainIndex = images.findIndex((item) => item.isMain)
    images.forEach((item, index) => {
      item.order = index
      item.isMain = index === (mainIndex >= 0 ? mainIndex : 0)
    })
  }

  const rawInventory = Array.isArray(data.inventory) ? (data.inventory as InventoryInput[]) : []
  const seen = new Set<string>()
  const inventory = rawInventory
    .map((item) => ({
      color: String(item?.color ?? '').trim(),
      colorHex: item?.colorHex,
      size: String(item?.size ?? '').trim(),
      quantity: Math.max(0, Math.trunc(Number(item?.quantity) || 0)),
    }))
    .filter((item) => {
      if (!item.color || !item.size) return false
      const key = `${item.color}\u0000${item.size}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  const fields: Record<string, unknown> = {}
  if (Array.isArray(data.images)) {
    fields.images = images.map((item) => ({ ...item, image: toObjectId(item.image) }))
  }
  if (Array.isArray(data.inventory)) {
    fields.inventory = inventory
  }

  const main = images.find((item) => item.isMain) ?? images[0]
  if (main) {
    fields.image = toObjectId(main.image)
    // `null` clears a stale hover image when the gallery shrinks.
    fields.hoverImage = images[1] ? toObjectId(images[1].image) : null
    const sizes = [...new Set(inventory.map((item) => item.size))]
    if (sizes.length) fields.sizes = sizes
  }
  return fields
}

export type LeanSizeRange = {
  size: string
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
}

export type LeanCategory = Omit<ICategory, 'tileImage' | 'tileHoverImage' | 'sizeChart'> & {
  _id: string
  tileImage?: { _id: string; url: string } | null
  tileHoverImage?: { _id: string; url: string } | null
  sizeChart?: LeanSizeRange[]
}

export type LeanOrder = Omit<IOrder, 'user' | 'lines'> & {
  _id: string
  user?: { _id: string; email: string }
  lines?: Array<{
    /** ObjectId on the raw document; the populated product when getOrder() loads it. */
    product: { _id: string; name?: string; slug?: string } | string
    /** Product name captured at the time of the order. */
    name: string
    color?: string
    size: string
    qty: number
    unitPrice: number
  }>
  customer: IOrder['customer']
}

export type LeanUser = Omit<IUser, never> & { _id: string }

export type LeanColor = Omit<IColor, never> & { _id: string }

export type LeanMessage = Omit<IMessage, never> & { _id: string }

export type LeanSubscriber = Omit<ISubscriber, never> & { _id: string }

export type LeanSiteSettings = Omit<ISiteSettings, 'heroImage' | 'promoImage' | 'storyImage' | 'featuredProducts' | 'featuredCategories'> & {
  _id: string
  heroImage?: { _id: string; url: string } | null
  promoImage?: { _id: string; url: string } | null
  storyImage?: { _id: string; url: string } | null
  featuredProducts?: Array<{ _id: string; name: string; slug: string }>
  featuredCategories?: Array<{ _id: string; name: string; slug: string }>
}

export type LeanDeliverySettings = Omit<IDeliverySettings, never> & { _id: string }

export type PaginatedResult<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
}

// Helper to ensure DB connection
async function ensureDB() {
  await connectDB()
}

// Helper to convert string to ObjectId
function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id)
}

/** URL-safe slug used when the form leaves the slug field empty. */
function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Dashboard
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
  const revenueAgg = await Order.aggregate([
    { $match: { status: { $nin: ["cancelled", "returned"] } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ])
  const totalRevenue = revenueAgg[0]?.total || 0

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
  }
}

// Products
export async function getProducts(page = 1, limit = 20, search = "", category = ""): Promise<PaginatedResult<LeanProduct>> {
  await ensureDB()

  const query: Record<string, unknown> = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ]
  }

  if (category) {
    query.category = category
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("colors", "name hex")
      .populate("image", "url filename")
      .lean(),
    Product.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanProduct[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getProduct(id: string): Promise<LeanProduct | null> {
  await ensureDB()
  return Product.findById(id)
    .populate("category", "name slug")
    .populate("colors", "name hex")
    .populate("image", "url filename")
    .populate("hoverImage", "url filename")
    .populate("images.image", "url filename")
    .lean() as unknown as LeanProduct | null
}

/**
 * Creates a product. If the chosen slug already exists, appends a numeric
 * suffix (-2, -3, ...) until a unique slug is found.
 */
export async function createProduct(data: Record<string, unknown>) {
  await ensureDB()

  const baseSlug = data.slug ? String(data.slug) : slugify(String(data.name ?? ''))

  let slug = baseSlug
  let counter = 2

  // Try creating the product; if the slug is duplicated, append a suffix and retry.
  while (true) {
    // Convert string IDs to ObjectIds where needed and normalize variant data.
    const {
      images: _rawImages,
      inventory: _rawInventory,
      image: rawImage,
      hoverImage: rawHoverImage,
      sizes: rawSizes,
      ...rest
    } = data
    const variantFields = buildVariantFields(data)
    const productData: Record<string, unknown> = {
      ...rest,
      ...variantFields,
      slug,
      category: data.category ? toObjectId(data.category as string) : undefined,
      colors: data.colors ? (data.colors as string[]).map(id => toObjectId(id)) : [],
      price: Number(data.price),
      compareAt: data.compareAt ? Number(data.compareAt) : undefined,
      active: Boolean(data.active),
      sortOrder: Number(data.sortOrder) || 0,
      // Empty strings are not valid enum values: omit the field instead.
      fit: data.fit ? String(data.fit) : undefined,
      status: data.status ? String(data.status) : undefined,
    }
    if (variantFields.image === undefined && rawImage) {
      productData.image = toObjectId(String(rawImage))
    }
    if (variantFields.hoverImage === undefined && rawHoverImage) {
      productData.hoverImage = toObjectId(String(rawHoverImage))
    }
    if (variantFields.sizes === undefined) {
      productData.sizes = Array.isArray(rawSizes) ? rawSizes : undefined
    }

    try {
      const result = await Product.create(productData)
      revalidatePath("/manage/products")
      revalidatePath("/manage/dashboard")
      refreshStorefront()
      return result
    } catch (error: any) {
      // MongoDB E11000 duplicate key error on the slug index
      if (error?.code === 11000 && error?.keyPattern?.slug) {
        slug = `${baseSlug}-${counter}`
        counter += 1
        if (counter > 100) throw new Error('Could not generate a unique slug. Please try a different product name.')
        continue
      }
      throw error
    }
  }
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  await ensureDB()

  const {
    images: _rawImages,
    inventory: _rawInventory,
    image: rawImage,
    hoverImage: rawHoverImage,
    sizes: rawSizes,
    ...rest
  } = data
  const variantFields = buildVariantFields(data)
  const updateData: Record<string, unknown> = {
    ...rest,
    ...variantFields,
    category: data.category ? toObjectId(data.category as string) : undefined,
    colors: data.colors ? (data.colors as string[]).map(id => toObjectId(id)) : undefined,
    price: data.price !== undefined ? Number(data.price) : undefined,
    compareAt: data.compareAt !== undefined ? (data.compareAt ? Number(data.compareAt) : null) : undefined,
    active: data.active !== undefined ? Boolean(data.active) : undefined,
    sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
    // Clearing the select means "no fit"/"no badge", not the empty string.
    fit: data.fit !== undefined ? (data.fit ? String(data.fit) : null) : undefined,
    status: data.status !== undefined ? (data.status ? String(data.status) : null) : undefined,
  }
  if (variantFields.image === undefined && rawImage !== undefined) {
    updateData.image = rawImage ? toObjectId(String(rawImage)) : null
  }
  if (variantFields.hoverImage === undefined && rawHoverImage !== undefined) {
    updateData.hoverImage = rawHoverImage ? toObjectId(String(rawHoverImage)) : null
  }
  if (variantFields.sizes === undefined && rawSizes !== undefined) {
    updateData.sizes = rawSizes
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key]
  })
  // Keep the existing slug when the field is cleared on the edit form.
  if (updateData.slug === '') delete updateData.slug

  const result = await Product.findByIdAndUpdate(id, updateData, { new: true })
  revalidatePath("/manage/products")
  revalidatePath("/manage/dashboard")
  refreshStorefront()
  return result
}

export async function deleteProduct(id: string) {
  await ensureDB()
  await Product.findByIdAndDelete(id)
  revalidatePath("/manage/products")
  revalidatePath("/manage/dashboard")
  refreshStorefront()
}

// Categories
export async function getCategories(): Promise<LeanCategory[]> {
  await ensureDB()
  return Category.find().sort({ sortOrder: 1 }).lean() as unknown as LeanCategory[]
}

export async function getCategoriesPaginated(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanCategory>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Category.find(query).sort({ sortOrder: 1 }).skip(skip).limit(limit).populate("tileImage", "url").populate("tileHoverImage", "url").lean(),
    Category.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanCategory[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getCategory(id: string): Promise<LeanCategory | null> {
  await ensureDB()
  return Category.findById(id).populate("tileImage", "url").populate("tileHoverImage", "url").lean() as unknown as LeanCategory | null
}

export async function createCategory(data: Record<string, unknown>) {
  await ensureDB()
  const name = String(data.name ?? '').trim()
  if (!name) throw new Error('Category name is required.')
  const categoryData = {
    ...data,
    name,
    slug: data.slug ? String(data.slug) : slugify(name),
    sortOrder: Number(data.sortOrder) || 0,
    tileImage: data.tileImage ? toObjectId(data.tileImage as string) : undefined,
    tileHoverImage: data.tileHoverImage ? toObjectId(data.tileHoverImage as string) : undefined,
    sizeChart: data.sizeChart ? JSON.parse(data.sizeChart as string) : undefined,
  }
  const result = await Category.create(categoryData)
  revalidatePath("/manage/categories")
  refreshStorefront()
  return result
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const updateData: Record<string, unknown> = {
    ...data,
    sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
    tileImage: data.tileImage ? toObjectId(data.tileImage as string) : (data.tileImage === null ? null : undefined),
    tileHoverImage: data.tileHoverImage ? toObjectId(data.tileHoverImage as string) : (data.tileHoverImage === null ? null : undefined),
    sizeChart: data.sizeChart !== undefined ? (data.sizeChart ? JSON.parse(data.sizeChart as string) : []) : undefined,
  }
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) delete updateData[key]
  })
  const result = await Category.findByIdAndUpdate(id, updateData, { new: true })
  revalidatePath("/manage/categories")
  refreshStorefront()
  return result
}

export async function deleteCategory(id: string) {
  await ensureDB()
  await Category.findByIdAndDelete(id)
  revalidatePath("/manage/categories")
  refreshStorefront()
}

// Orders
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

// Colors
export async function getColors(): Promise<LeanColor[]> {
  await ensureDB()
  return Color.find({ isActive: true }).sort({ sortOrder: 1 }).lean() as unknown as LeanColor[]
}

export async function getColorsPaginated(page = 1, limit = 20, search = ""): Promise<PaginatedResult<LeanColor>> {
  await ensureDB()

  const query: Record<string, unknown> = {}
  if (search) {
    query.name = { $regex: search, $options: "i" }
  }

  const skip = (page - 1) * limit

  const [docs, totalDocs] = await Promise.all([
    Color.find(query).sort({ sortOrder: 1 }).skip(skip).limit(limit).lean(),
    Color.countDocuments(query),
  ])

  return {
    docs: docs as unknown as LeanColor[],
    totalDocs,
    totalPages: Math.ceil(totalDocs / limit),
    page,
  }
}

export async function getColor(id: string): Promise<LeanColor | null> {
  await ensureDB()
  return Color.findById(id).lean() as unknown as LeanColor | null
}

export async function createColor(data: Record<string, unknown>) {
  await ensureDB()
  const result = await Color.create(data)
  revalidatePath("/manage/colors")
  return result
}

export async function updateColor(id: string, data: Record<string, unknown>) {
  await ensureDB()
  const result = await Color.findByIdAndUpdate(id, data, { new: true })
  revalidatePath("/manage/colors")
  return result
}

export async function deleteColor(id: string) {
  await ensureDB()
  await Color.findByIdAndDelete(id)
  revalidatePath("/manage/colors")
}

// Messages
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

// Subscribers
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

// Media
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
])

export type UploadedMedia = { id: string; url: string; width?: number; height?: number }

/** Stores an image picked from the admin's device and returns its media id. */
export async function uploadMedia(formData: FormData): Promise<UploadedMedia> {
  await ensureDB()

  const file = formData.get("file")
  if (!(file instanceof File)) throw new Error("Choose an image file to upload.")
  console.log('[uploadMedia] file received:', { name: file.name, type: file.type, size: file.size })
  if (file.size === 0) throw new Error("That file is empty.")
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.")
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, WebP, GIF, AVIF or SVG images are supported.")
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  console.log('[uploadMedia] bytes length:', bytes.length)
  const _id = new mongoose.Types.ObjectId()
  const dimension = (key: string) => {
    const value = Number(formData.get(key))
    return Number.isFinite(value) && value > 0 ? Math.round(value) : undefined
  }

  const media = await Media.create({
    _id,
    filename: (file.name || "image").replace(/[^\w.-]+/g, "-").slice(-100),
    mimeType: file.type,
    filesize: bytes.length,
    width: dimension("width"),
    height: dimension("height"),
    url: `/api/media/file/${_id.toString()}`,
    data: bytes,
  })
  console.log('[uploadMedia] media created:', { id: media._id, hasData: !!media.data, dataLength: media.data?.length, filesize: media.filesize })

  return { id: String(media._id), url: media.url, width: media.width, height: media.height }
}

// Site Settings (Global) - singleton document
export async function getSiteSettings(): Promise<LeanSiteSettings> {
  await ensureDB()
  let settings = await SiteSettings.findOne()
    .populate("heroImage", "url")
    .populate("promoImage", "url")
    .populate("storyImage", "url")
    .populate("featuredProducts", "name slug")
    .populate("featuredCategories", "name slug")
    .lean()

  if (!settings) {
    // Create default settings document
    settings = await SiteSettings.create({})
  }

  return settings as unknown as LeanSiteSettings
}

export async function updateSiteSettings(data: Record<string, unknown>) {
  await ensureDB()

  // Convert string IDs to ObjectIds for relationships
  const updateData = { ...data }
  // An empty value means "remove the image"; missing keys stay untouched.
  if ("heroImage" in data) updateData.heroImage = data.heroImage ? toObjectId(String(data.heroImage)) : null
  if ("promoImage" in data) updateData.promoImage = data.promoImage ? toObjectId(String(data.promoImage)) : null
  if ("storyImage" in data) updateData.storyImage = data.storyImage ? toObjectId(String(data.storyImage)) : null
  if (data.featuredProducts) {
    updateData.featuredProducts = (data.featuredProducts as string[]).map(id => toObjectId(id))
  }
  if (data.featuredCategories) {
    updateData.featuredCategories = (data.featuredCategories as string[]).map(id => toObjectId(id))
  }

  const settings = await SiteSettings.findOneAndUpdate({}, updateData, { upsert: true, new: true })
    .populate("heroImage", "url")
    .populate("promoImage", "url")
    .populate("storyImage", "url")
    .populate("featuredProducts", "name slug")
    .populate("featuredCategories", "name slug")
    .lean()

  revalidatePath("/manage/settings")
  refreshStorefront()
  return settings as unknown as LeanSiteSettings
}

// Delivery Settings (Global) - singleton document
export async function getDeliverySettings(): Promise<LeanDeliverySettings> {
  await ensureDB()
  let settings = await DeliverySettings.findOne().lean()

  if (!settings) {
    // Create defaults that match the storefront's static fallback (DEFAULT_ZONES).
    const zones = Object.values(DEFAULT_ZONES).map((zone) => ({
      zone: zone.id,
      label: `Zone ${zone.id}`,
      homeFee: zone.home,
      deskFee: zone.desk,
      minDays: zone.days[0],
      maxDays: zone.days[1],
    }))
    settings = await DeliverySettings.create({
      freeShippingThreshold: 15000,
      loyaltyFreeDeliveryThreshold: 15000,
      zones,
    })
  }

  return settings as unknown as LeanDeliverySettings
}

/**
 * Coerce a raw `communeFees` array into clean subdocuments. Unknown wilaya codes
 * and communes are dropped, numbers clamped. When `wilayaFilter` is given only
 * rows for that wilaya are kept. Returns undefined for non-array input.
 */
function sanitizeCommuneFees(input: unknown, wilayaFilter?: string) {
  if (!Array.isArray(input)) return undefined
  const wilayaCodes = new Set(DEFAULT_WILAYAS.map((wilaya) => wilaya.code))
  const seen = new Set<string>()
  const rows: Array<{ wilayaCode: string; commune: string; homeFee: number; deskFee: number }> = []
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue
    const raw = entry as Record<string, unknown>
    const wilayaCode = String(raw.wilayaCode ?? '').trim().padStart(2, '0')
    const commune = String(raw.commune ?? '').trim()
    if (wilayaFilter && wilayaCode !== wilayaFilter) continue
    if (!wilayaCodes.has(wilayaCode)) continue
    const key = `${wilayaCode}:${communeKey(commune)}`
    if (!KNOWN_COMMUNES.has(key) || seen.has(key)) continue
    seen.add(key)
    rows.push({
      wilayaCode,
      commune,
      homeFee: Math.max(0, Math.trunc(Number(raw.homeFee) || 0)),
      deskFee: Math.max(0, Math.trunc(Number(raw.deskFee) || 0)),
    })
  }
  return rows
}

export async function updateDeliverySettings(data: Record<string, unknown>) {
  await ensureDB()
  const updateData: Record<string, unknown> = { ...data }

  // Free-delivery thresholds: keep DZD amounts non-negative integers.
  // A stored 0 is respected (it disables the loyalty reward); only junk
  // becomes the default.
  // Accept French-style separators ("20 000", "20,000") in the threshold inputs.
  // A stored 0 is respected; an empty field means "use the default".
  const parseDzd = (raw: unknown): number => {
    if (typeof raw === "string" && raw.trim() === "") return NaN
    const cleaned = typeof raw === "string" ? raw.replace(/[\s,]/g, "") : raw
    return Math.trunc(Number(cleaned))
  }
  if (updateData.freeShippingThreshold !== undefined) {
    const n = parseDzd(updateData.freeShippingThreshold)
    updateData.freeShippingThreshold = Number.isFinite(n) && n >= 0 ? n : 15000
  }
  if (updateData.loyaltyFreeDeliveryThreshold !== undefined) {
    const n = parseDzd(updateData.loyaltyFreeDeliveryThreshold)
    updateData.loyaltyFreeDeliveryThreshold = Number.isFinite(n) && n >= 0 ? n : 15000
  }

  // Commune fees are edited one wilaya at a time: replace that wilaya's rows,
  // keep every other wilaya's overrides, and drop anything identical to the
  // inherited zone price so the CMS stays sparse.
  const communeWilayaRaw = typeof updateData.communeWilaya === 'string' ? updateData.communeWilaya : undefined
  delete updateData.communeWilaya
  if (communeWilayaRaw !== undefined || updateData.communeFees !== undefined) {
    const wilayaCode = String(communeWilayaRaw ?? '').trim().padStart(2, '0')
    const existing = await DeliverySettings.findOne({}).lean() as unknown as {
      communeFees?: Array<{ wilayaCode: string; commune: string; homeFee: number; deskFee: number }>
      zones?: Array<{ zone: number; homeFee: number; deskFee: number; minDays: number; maxDays: number }>
      freeShippingThreshold?: number
    } | null
    const existingDoc = existing ?? null
    let rows = (existing?.communeFees ?? []).map((row) => ({ ...row }))
    if (/^\d{2}$/.test(wilayaCode)) {
      rows = rows.filter((row) => String(row.wilayaCode ?? '').padStart(2, '0') !== wilayaCode)
    }
    const submitted = sanitizeCommuneFees(updateData.communeFees, /^\d{2}$/.test(wilayaCode) ? wilayaCode : undefined) ?? []
    const found = /^\d{2}$/.test(wilayaCode) ? DEFAULT_WILAYAS.find((wilaya) => wilaya.code === wilayaCode) : undefined
    const inherited = found ? resolveZoneFees(existingDoc)[found.zone] : undefined
    const sparser = inherited
      ? submitted.filter((row) => row.homeFee !== inherited.home || row.deskFee !== inherited.desk)
      : submitted
    updateData.communeFees = sanitizeCommuneFees([...rows, ...sparser])
  }

  const settings = await DeliverySettings.findOneAndUpdate({}, updateData, { upsert: true, new: true }).lean()
  revalidatePath("/manage/delivery")
  refreshStorefront()
  return settings as unknown as LeanDeliverySettings
}