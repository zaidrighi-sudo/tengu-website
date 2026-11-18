import { getDashboardStats } from "@/features/dashboard/backend"
import { AdminDashboardContent } from "@/features/dashboard/AdminDashboardContent"

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  return <AdminDashboardContent stats={stats} />
}