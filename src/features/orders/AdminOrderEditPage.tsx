import Link from "next/link"
import { notFound } from "next/navigation"
import { getOrder } from "@/features/orders/backend"
import { formatDate, getStatusLabel } from "@/features/admin/helpers"
import { OrderEditForm } from "@/features/orders/OrderEditForm"
import "@/shared/styles/global.css"
import "@/features/admin/admin.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditOrderPage({ params }: PageProps) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) notFound()

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li>
            <Link href="/manage/orders">ORDERS</Link>
          </li>
          <li aria-current="page">{order.number}</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 04 / ORDER RECORD · 注文詳細 ]</div>
            <h1 className="admin-page-title">ORDER {order.number}</h1>
            <p className="admin-page-subtitle">
              Customer: {order.customer?.firstName} {order.customer?.lastName} · Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`admin-status admin-status-${String(order.status).toLowerCase()}`}>
            {getStatusLabel(String(order.status))}
          </span>
        </div>
      </header>

      <OrderEditForm order={order} />
    </div>
  )
}
