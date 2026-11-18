"use client"

import React, { useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts"

export interface SalesDatum {
  /** ISO date, e.g. "2026-10-19" */
  date: string
  revenue: number
  orders: number
}

interface ChartPoint extends SalesDatum {
  /** e.g. "19/10" */
  day: string
  /** e.g. "Sun 19 Oct" */
  fullLabel: string
}

const parseLocal = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}

const buildRows = (data: SalesDatum[]): ChartPoint[] =>
  data.map((d) => {
    const date = parseLocal(d.date)
    const day = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`
    const fullLabel = date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
    return { ...d, day, fullLabel }
  })

const formatCompact = (n: number): string =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const AXIS_TICK = {
  fill: "var(--admin-muted)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
} as const

const GRID_STROKE = "var(--admin-border)"

function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="admin-chart-tooltip" role="tooltip">
      <span className="admin-chart-tooltip-date">{point.fullLabel}</span>
      <span className="admin-chart-tooltip-row">
        <span className="admin-chart-tooltip-label">Revenue</span>
        <strong>{formatCurrency(point.revenue)}</strong>
      </span>
      <span className="admin-chart-tooltip-row">
        <span className="admin-chart-tooltip-label">Orders</span>
        <strong>{point.orders}</strong>
      </span>
    </div>
  )
}

const yMax = (dataMax: number) => Math.max(Math.ceil(dataMax * 1.15), 4)

export function RevenueTrendChart({ data }: { data: SalesDatum[] }) {
  const rows = useMemo(() => buildRows(data), [data])

  if (rows.length === 0) {
    return <ChartEmpty label="Revenue trend" />
  }

  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  const peak = rows.reduce((best, row) => (row.revenue > best.revenue ? row : best), rows[0])

  return (
    <div className="admin-chart-figure" role="img" aria-label={`Area chart of daily revenue across the last ${rows.length} days. Total ${formatCurrency(total)}.`}>
      <div className="admin-chart-total">
        <span className="admin-chart-total-label">PERIOD GROSS</span>
        <span className="admin-chart-total-value">{formatCurrency(total)}</span>
      </div>
      <div className="admin-chart-plot">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tenguRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
                <stop offset="60%" stopColor="#ffffff" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              minTickGap={26}
              interval="preserveStartEnd"
            />
            <YAxis
              width={38}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={formatCompact}
              domain={[0, yMax]}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--admin-border-strong)", strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#tenguRevenueFill)"
              dot={false}
              activeDot={{ r: 4.5, fill: "#ffffff", stroke: "#000000", strokeWidth: 2 }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            {peak.revenue > 0 && (
              <ReferenceDot
                x={peak.day}
                y={peak.revenue}
                r={4.5}
                fill="var(--admin-red)"
                stroke="#000000"
                strokeWidth={1.5}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="admin-chart-foot" aria-hidden="true">
        <span>{rows[0]?.day}</span>
        <span>{rows[Math.floor(rows.length / 2)]?.day}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </div>
  )
}

export function OrderVolumeChart({ data }: { data: SalesDatum[] }) {
  const rows = useMemo(() => buildRows(data), [data])

  if (rows.length === 0) {
    return <ChartEmpty label="Order volume" />
  }

  const total = rows.reduce((sum, row) => sum + row.orders, 0)
  const activeDays = rows.filter((row) => row.orders > 0).length
  const peak = rows.reduce((best, row) => (row.orders > best.orders ? row : best), rows[0])

  return (
    <div className="admin-chart-figure" role="img" aria-label={`Bar chart of orders per day across the last ${rows.length} days. ${total} orders in total.`}>
      <div className="admin-chart-total">
        <span className="admin-chart-total-label">PERIOD ORDERS</span>
        <span className="admin-chart-total-value">
          {total} <em>{activeDays} ACTIVE {activeDays === 1 ? "DAY" : "DAYS"}</em>
        </span>
      </div>
      <div className="admin-chart-plot">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="2 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              minTickGap={26}
              interval="preserveStartEnd"
            />
            <YAxis
              width={30}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              domain={[0, yMax]}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(255, 255, 255, 0.06)" }}
            />
            <Bar
              dataKey="orders"
              radius={[2, 2, 0, 0]}
              minPointSize={2}
              animationDuration={1100}
              animationEasing="ease-out"
              animationBegin={150}
            >
              {rows.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.orders === 0 ? "#2a2a2a" : entry.date === peak.date && peak.orders > 0 ? "#d00000" : "#ffffff"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="admin-chart-foot" aria-hidden="true">
        <span>{rows[0]?.day}</span>
        <span>{rows[Math.floor(rows.length / 2)]?.day}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </div>
    </div>
  )
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="admin-chart-empty" role="status">
      <span className="admin-chart-empty-num" aria-hidden="true">00</span>
      <span className="admin-chart-empty-text">NO SALES DATA YET — {label.toUpperCase()} WILL APPEAR ONCE ORDERS START FLOWING</span>
    </div>
  )
}
