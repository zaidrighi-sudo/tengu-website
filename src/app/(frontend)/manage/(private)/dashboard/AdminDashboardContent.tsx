"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import {
  Package,
  DollarSign,
  Users,
  Package2,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowUpRight,
  CircleCheck,
  CircleX,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
} from "lucide-react"
import { RevenueTrendChart, OrderVolumeChart } from "./AdminCharts"

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  lowStockProducts: number
  recentOrders: Array<{
    id: string
    number: string
    customer: string
    total: number
    status: string
    createdAt: Date | string
  }>
  salesData: Array<{
    date: string
    revenue: number
    orders: number
  }>
  /** All-time outcome split, recorded after the confirmation call. */
  outcomes: {
    delivered: { count: number; value: number }
    returned: { count: number; value: number }
    cancelled: { count: number; value: number }
  }
  /** Collected revenue / collected orders (all-time). */
  avgOrderValue: number
  /** Collected revenue / unique buyer phones (all-time). */
  ltv: number
  /** Cancelled / (delivered + returned + cancelled), % — null when nothing resolved yet. */
  cancelRate: number | null
}

interface AdminDashboardContentProps {
  stats: DashboardStats
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}



export function AdminDashboardContent({ stats }: AdminDashboardContentProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = useMemo(() => {
    return stats.recentOrders
      .filter((order) => {
        if (filterStatus !== "all" && order.status !== filterStatus) return false
        if (
          searchQuery &&
          !order.number.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !order.customer.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (!sortConfig) return 0
        const aVal = a[sortConfig.key as keyof typeof a]
        const bVal = b[sortConfig.key as keyof typeof b]
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
  }, [stats.recentOrders, filterStatus, searchQuery, sortConfig])

  const outcomeTotal =
    stats.outcomes.delivered.count + stats.outcomes.returned.count + stats.outcomes.cancelled.count
  const completionRate = outcomeTotal > 0
    ? Math.round((stats.outcomes.delivered.count / outcomeTotal) * 100)
    : null

  const statusDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const order of stats.recentOrders) {
      counts.set(order.status, (counts.get(order.status) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] || status }))
      .sort((a, b) => b.count - a.count)
  }, [stats.recentOrders])

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const statCards = [
    {
      key: "orders",
      label: "TOTAL ORDERS",
      value: stats.totalOrders.toLocaleString(),
      subtitle: stats.pendingOrders > 0 ? `${stats.pendingOrders} PENDING ACTION` : "ALL ORDERS FULFILLED",
      hasAlert: stats.pendingOrders > 0,
      icon: Package,
    },
    {
      key: "revenue",
      label: "TOTAL REVENUE",
      value: formatCurrency(stats.totalRevenue),
      subtitle: "ALL-TIME STORE GROSS",
      hasAlert: false,
      icon: DollarSign,
    },
    {
      key: "aov",
      label: "AVG ORDER VALUE",
      value: formatCurrency(stats.avgOrderValue),
      subtitle: "COLLECTED REVENUE PER ORDER",
      hasAlert: false,
      icon: Banknote,
    },
    {
      key: "ltv",
      label: "LIFETIME VALUE / BUYER",
      value: formatCurrency(stats.ltv),
      subtitle: "ALL-TIME REVENUE PER UNIQUE PHONE",
      hasAlert: false,
      icon: Wallet,
    },
    {
      key: "customers",
      label: "REGISTERED CUSTOMERS",
      value: stats.totalCustomers.toLocaleString(),
      subtitle: "VERIFIED BUYER ACCOUNTS",
      hasAlert: false,
      icon: Users,
    },
    {
      key: "products",
      label: "CATALOG PIECES",
      value: stats.totalProducts.toLocaleString(),
      subtitle: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} LOW STOCK ITEMS` : "ALL PIECES IN STOCK",
      hasAlert: stats.lowStockProducts > 0,
      icon: Package2,
    },
    {
      key: "pending",
      label: "PENDING ORDERS",
      value: stats.pendingOrders.toLocaleString(),
      subtitle: stats.pendingOrders > 0 ? "REQUIRES CONFIRMATION" : "QUEUE EMPTY",
      hasAlert: stats.pendingOrders > 0,
      icon: Clock,
    },
  ]

  return (
    <div className="admin-page">
      {/* Breadcrumb & Page Head */}
      <header className="admin-page-header">
        <ol className="admin-crumbs">
          <li>
            <Link href="/manage/dashboard">ADMIN</Link>
          </li>
          <li aria-current="page">DASHBOARD</li>
        </ol>

        <div className="admin-header-row">
          <div>
            <div className="admin-page-index">[ 01 / OVERVIEW · 概要 ]</div>
            <h1 className="admin-page-title">DASHBOARD</h1>
            <p className="admin-page-subtitle">
              Real-time storefront performance, active inventory health, and recent customer order activity.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/manage/products/new" className="admin-btn admin-btn-primary">
              <Plus size={14} />
              <span>Add Product</span>
            </Link>
            <Link href="/" target="_blank" className="admin-btn admin-btn-secondary">
              <ArrowUpRight size={14} />
              <span>Live Shop</span>
            </Link>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="admin-stats-grid" aria-label="Key Performance Indicators">
        {statCards.map((card) => {
          const IconComponent = card.icon
          return (
            <article key={card.key} className={`admin-stat-card ${card.hasAlert ? "has-alert" : ""}`}>
              <div className="admin-stat-head">
                <span className="admin-stat-label">{card.label}</span>
                <IconComponent className="admin-stat-icon" aria-hidden="true" />
              </div>
              <div className="admin-stat-value">{card.value}</div>
              <div className="admin-stat-subtitle">
                {card.hasAlert && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      background: "var(--admin-red)",
                      marginRight: "4px",
                    }}
                  />
                )}
                <span>{card.subtitle}</span>
              </div>
            </article>
          )
        })}
      </section>

      {/* Analytics Section */}
      <section className="admin-charts-grid">
        {/* Revenue Trend Chart */}
        <article className="admin-form-section admin-chart-card" style={{ padding: "clamp(1rem, 2vw, 1.25rem)" }}>
          <div className="admin-chart-head">
            <div>
              <span className="admin-stat-label">REVENUE TREND</span>
              <h2 className="admin-form-section-title" style={{ margin: 0, border: "none", padding: 0 }}>
                LAST 30 DAYS
              </h2>
            </div>
            <span className="admin-tag admin-tag-out">DZD GROSS</span>
          </div>

          <RevenueTrendChart data={stats.salesData.slice(-30)} />
        </article>

        {/* Order Volume Bar Chart */}
        <article className="admin-form-section admin-chart-card" style={{ padding: "clamp(1rem, 2vw, 1.25rem)" }}>
          <div className="admin-chart-head">
            <div>
              <span className="admin-stat-label">ORDER VOLUME</span>
              <h2 className="admin-form-section-title" style={{ margin: 0, border: "none", padding: 0 }}>
                DAILY ORDERS
              </h2>
            </div>
            <span className="admin-tag admin-tag-out">PIECES</span>
          </div>

          <OrderVolumeChart data={stats.salesData.slice(-30)} />
        </article>
      </section>

      {/* Order Outcomes — recorded after the confirmation call */}
      <section className="admin-form-section" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4) var(--space-5)" }} aria-label="Order outcomes">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <span className="admin-stat-label">ORDER OUTCOMES · ALL TIME</span>
          <span style={{ fontSize: "0.6875rem", color: "var(--admin-muted)" }}>
            REGISTERED AFTER THE CONFIRMATION CALL
          </span>
        </div>
        <div className="admin-stats-grid" style={{ marginBottom: 0 }}>
          <article className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-label">COMPLETED</span>
              <CircleCheck className="admin-stat-icon" aria-hidden="true" />
            </div>
            <div className="admin-stat-value">{stats.outcomes.delivered.count.toLocaleString()}</div>
            <div className="admin-stat-subtitle">
              <span>{formatCurrency(stats.outcomes.delivered.value)} COLLECTED</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-label">RETURNED</span>
              <RotateCcw className="admin-stat-icon" aria-hidden="true" />
            </div>
            <div className="admin-stat-value">{stats.outcomes.returned.count.toLocaleString()}</div>
            <div className="admin-stat-subtitle">
              <span>{formatCurrency(stats.outcomes.returned.value)} CAME BACK</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-label">ANNULLED</span>
              <CircleX className="admin-stat-icon" aria-hidden="true" />
            </div>
            <div className="admin-stat-value">{stats.outcomes.cancelled.count.toLocaleString()}</div>
            <div className="admin-stat-subtitle">
              <span>{formatCurrency(stats.outcomes.cancelled.value)} CANCELLED</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-label">COMPLETION RATE</span>
              <TrendingUp className="admin-stat-icon" aria-hidden="true" />
            </div>
            <div className="admin-stat-value">{completionRate === null ? "—" : `${completionRate}%`}</div>
            <div className="admin-stat-subtitle">
              <span>{outcomeTotal} RESOLVED ORDERS</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-label">CANCELLATION RATE</span>
              <TrendingDown className="admin-stat-icon" aria-hidden="true" />
            </div>
            <div className="admin-stat-value">{stats.cancelRate === null ? "—" : `${stats.cancelRate}%`}</div>
            <div className="admin-stat-subtitle">
              <span>ANNULLED OF {outcomeTotal} RESOLVED</span>
            </div>
          </article>
        </div>
      </section>

      {/* Order Status Breakdown Strip */}
      {statusDistribution.length > 0 && (
        <section className="admin-form-section" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4) var(--space-5)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span className="admin-stat-label">STATUS DISTRIBUTION</span>
            <span style={{ fontSize: "0.6875rem", color: "var(--admin-muted)" }}>
              {stats.recentOrders.length} RECENT ORDERS
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div
            style={{
              display: "flex",
              height: "8px",
              background: "var(--admin-border)",
              width: "100%",
              marginBottom: "1rem",
              overflow: "hidden",
            }}
          >
            {statusDistribution.map((item) => {
              const pct = (item.count / stats.recentOrders.length) * 100
              const isConfirmed = item.status === "confirmed" || item.status === "delivered"
              const isCancelled = item.status === "cancelled" || item.status === "failed"
              const bg = isCancelled ? "var(--admin-red)" : isConfirmed ? "#ffffff" : "var(--admin-muted)"
              return (
                <div
                  key={item.status}
                  style={{
                    width: `${pct}%`,
                    background: bg,
                    borderRight: "1px solid #000000",
                  }}
                  title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                />
              )
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {statusDistribution.map((item) => (
              <div key={item.status} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.6875rem" }}>
                <span className={`admin-status admin-status-${item.status.toLowerCase()}`}>
                  {item.label}
                </span>
                <span style={{ color: "var(--admin-muted)", fontWeight: 600 }}>({item.count})</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders Section */}
      <section>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <div>
            <div className="admin-page-index">[ 02 / RECENT TRANSACTIONS ]</div>
            <h2 className="admin-form-section-title" style={{ margin: 0, border: "none", padding: 0 }}>
              RECENT ORDERS
            </h2>
          </div>
          <span className="admin-filter-count">
            SHOWING {filteredOrders.length} OF {stats.recentOrders.length}
          </span>
        </div>

        {/* Filter & Search Bar (Shop Style) */}
        <div className="admin-toolbar">
          <div className="admin-search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ORDERS BY NUMBER OR CUSTOMER..."
              className="admin-search-input"
              aria-label="Search orders"
            />
          </div>

          <div className="admin-filters">
            {["all", "new", "confirmed", "shipped", "delivered", "cancelled", "returned"].map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilterStatus(statusKey)}
                className={`admin-btn admin-btn-sm ${filterStatus === statusKey ? "admin-btn-primary" : "admin-btn-secondary"}`}
              >
                {statusKey === "all" ? "ALL" : STATUS_LABELS[statusKey]?.toUpperCase() || statusKey.toUpperCase()}
              </button>
            ))}
            {(searchQuery || filterStatus !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setFilterStatus("all")
                }}
                className="admin-btn admin-btn-sm admin-btn-ghost"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "36px" }}></th>
                  <th>ORDER #</th>
                  <th>CUSTOMER</th>
                  <th style={{ textAlign: "right" }}>TOTAL</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                  <th style={{ textAlign: "right" }}>PLACED</th>
                  <th style={{ width: "70px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedRows.has(order.id)
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => toggleRow(order.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            className="admin-action-btn"
                            style={{ width: "1.75rem", height: "1.75rem", border: "none" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRow(order.id)
                            }}
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.05em" }}>
                            {order.number}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{order.customer}</div>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                          {formatCurrency(order.total)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", color: "var(--admin-muted)", fontSize: "0.75rem" }}>
                          {formatRelativeTime(order.createdAt)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <Link
                            href={`/manage/orders/${order.id}/edit`}
                            className="admin-action-btn"
                            title="Edit Order"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                        </td>
                      </tr>

                      {/* Expandable Order Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: "var(--admin-surface)", padding: "clamp(0.875rem, 2vw, 1.25rem)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "0.875rem", fontSize: "0.75rem" }}>
                              <div>
                                <span className="admin-stat-label">ORDER ID</span>
                                <div style={{ fontFamily: "var(--font-mono)", color: "#ffffff", marginTop: "2px" }}>
                                  {order.id}
                                </div>
                              </div>
                              <div>
                                <span className="admin-stat-label">CUSTOMER NAME</span>
                                <div style={{ color: "#ffffff", marginTop: "2px" }}>
                                  {order.customer}
                                </div>
                              </div>
                              <div>
                                <span className="admin-stat-label">TOTAL AMOUNT</span>
                                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>
                                  {formatCurrency(order.total)}
                                </div>
                              </div>
                              <div>
                                <span className="admin-stat-label">STATUS</span>
                                <div style={{ marginTop: "4px" }}>
                                  <span className={`admin-status admin-status-${order.status.toLowerCase()}`}>
                                    {STATUS_LABELS[order.status] || order.status}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="admin-stat-label">TIMESTAMP</span>
                                <div style={{ color: "var(--admin-muted)", marginTop: "2px" }}>
                                  {formatDate(order.createdAt)} ({formatRelativeTime(order.createdAt)})
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty">
            <div className="admin-empty-num">00</div>
            <h3 className="admin-empty-title">NO ORDERS FOUND</h3>
            <p className="admin-empty-text">
              {searchQuery || filterStatus !== "all"
                ? "No customer orders fit this combination of query and status filter."
                : "No customer orders have been placed yet."}
            </p>
            {(searchQuery || filterStatus !== "all") && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setSearchQuery("")
                  setFilterStatus("all")
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
