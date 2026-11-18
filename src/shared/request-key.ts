import 'server-only'

import { headers } from 'next/headers'

/**
 * Best-effort client address for rate limiting.
 *
 * Behind the platform proxy the real address is the first entry of
 * `x-forwarded-for`; `x-real-ip` is the fallback. Without either (local dev)
 * every caller shares the "local" bucket.
 */
export async function clientAddress(): Promise<string> {
  try {
    const store = await headers()
    const forwarded = store.get('x-forwarded-for')
    const first = forwarded?.split(',')[0]?.trim()
    if (first) return first
    return store.get('x-real-ip')?.trim() || 'local'
  } catch {
    // Called outside a request (for example from a script).
    return 'local'
  }
}

/** Rate-limit key scoped to one address and one action. */
export async function addressKey(action: string): Promise<string> {
  return `${action}:${await clientAddress()}`
}
