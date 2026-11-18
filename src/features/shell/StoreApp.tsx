'use client'

import { useRef } from 'react'
import '@fontsource/anton/latin-400.css'
import '@fontsource/space-grotesk/latin-300.css'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'

import App from '@/features/shell/App'
import type { User } from '@/features/auth/AuthContext'
import { type StoreData, hydrateStore } from '@/features/site-settings/data'
import '@/shared/styles/global.css'

export default function StoreApp({ data, user }: { data: StoreData | null; user: User | null }) {
  // Load CMS data into the app's stores before the first render. This must
  // happen synchronously during render (not in an effect): the pages read the
  // `products` array at module scope and memoise derived lists on first
  // render, so hydrating later would leave them permanently empty.
  const hydrated = useRef(false)
  if (!hydrated.current) {
    hydrated.current = true
    if (data && data.products.length > 0) {
      hydrateStore(data)
    }
  }

  return <App user={user} />
}
