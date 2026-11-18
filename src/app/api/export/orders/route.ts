import { NextResponse } from 'next/server'
import { connectDB, Order } from '@/shared/mongodb/models'
import { adminAuth } from '@/features/auth/admin-auth'
import { takeToken } from '@/shared/rate-limit'

/**
 * Distributor manifest export.
 * Streams the matching orders as a CSV file, grouped for printed courier
 * rounds: wilaya → commune → oldest first.
 *
 * Admin-only (same gate as /api/media/upload) and rate limited, because the
 * file carries customer names, phones and addresses.
 *
 *   GET /api/export/orders?status=new   (default: new; "all" exports every order)
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ORDER_STATUSES = new Set(['new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'])
const EXPORT_WINDOW_MS = 10 * 60 * 1000
const EXPORT_MAX_PER_WINDOW = 20
const MAX_ROWS = 5000

/** Escape one CSV cell (RFC 4180). */
function cell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function row(values: unknown[]): string {
  return values.map(cell).join(',')
}

export async function GET(request: Request) {
  const admin = await adminAuth.currentUser()
  if (!admin) {
    return NextResponse.json({ error: 'Please sign in to the admin dashboard.' }, { status: 401 })
  }

  const quota = takeToken(`export-orders:${admin.id}`, {
    max: EXPORT_MAX_PER_WINDOW,
    windowMs: EXPORT_WINDOW_MS,
  })
  if (!quota.ok) {
    return NextResponse.json(
      { error: 'Too many exports. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } },
    )
  }

  const url = new URL(request.url)
  const status = (url.searchParams.get('status') ?? 'new').trim().toLowerCase()
  if (status !== 'all' && !ORDER_STATUSES.has(status)) {
    return NextResponse.json({ error: `Unknown status "${status}".` }, { status: 400 })
  }

  try {
    await connectDB()

    const query = status === 'all' ? {} : { status }
    const docs = await Order.find(query)
      .sort({ 'address.wilaya': 1, 'address.commune': 1, createdAt: 1 })
      .limit(MAX_ROWS)
      .lean()

    const header = row([
      'Order Number',
      'Date',
      'Customer',
      'Phone',
      'Wilaya',
      'Commune',
      'Street',
      'Landmark',
      'Delivery',
      'Items',
      'Total (DA)',
      'Status',
    ])

    const lines = [header]
    for (const order of docs) {
      const customer = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim()
      const items = (order.lines ?? [])
        .map((line: { qty: number; name: string; color?: string; size?: string }) => {
          const variant = [line.color, line.size].filter(Boolean).join(' / ')
          return `${line.qty}x ${line.name}${variant ? ` (${variant})` : ''}`
        })
        .join('; ')
      const placed = order.createdAt instanceof Date ? order.createdAt.toISOString().slice(0, 10) : ''
      lines.push(
        row([
          order.number,
          placed,
          customer,
          order.customer?.phone,
          order.address?.wilaya,
          order.address?.commune,
          order.address?.street,
          order.address?.landmark,
          order.deliveryMethod === 'desk' ? 'Stop Desk' : 'Home Delivery',
          items,
          order.total,
          order.status,
        ]),
      )
    }

    // UTF-8 BOM so Excel renders Arabic/French accents correctly.
    const csv = `\uFEFF${lines.join('\r\n')}\r\n`
    const stamp = new Date().toISOString().slice(0, 10)
    const filename = `tengu-orders-${status}-${stamp}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[export/orders] Error:', error)
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
