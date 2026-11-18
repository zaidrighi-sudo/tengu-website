import { getDashboardStats } from "@/lib/admin/actions/dashboard"
import { AdminDashboardContent } from "./AdminDashboardContent"

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  return <AdminDashboardContent stats={stats} />
}