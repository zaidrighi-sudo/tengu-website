// Helper functions for admin dashboard (no "use server" directive)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string | Date): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "#ffffff",
    confirmed: "#ffffff",
    shipped: "#e5e5e5",
    delivered: "#ffffff",
    cancelled: "#d00000",
    returned: "#8a8a8a",
  }
  return colors[status] || "#8a8a8a"
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: "New",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  }
  return labels[status] || status
}
