'use client'

import dynamic from 'next/dynamic'

import type { User } from '@/features/auth/AuthContext'
import type { StoreData } from '@/features/site-settings/data'

// The storefront is a hash-routed app that reads window, localStorage and
// document at import time, so it renders in the browser only.
const StoreApp = dynamic(() => import('@/features/shell/StoreApp'), { ssr: false })

/** `data` and `user` are null for a visitor who has not signed in yet. */
export function StoreEntry({ data, user }: { data: StoreData | null; user: User | null }) {
  return <StoreApp data={data} user={user} />
}
