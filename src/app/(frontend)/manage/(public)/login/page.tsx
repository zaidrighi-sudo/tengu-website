import { redirect } from "next/navigation"

export default async function AdminLoginRedirectPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams
  const next = params.next || "/manage/dashboard"
  redirect(`/#/login?next=${encodeURIComponent(next)}`)
}