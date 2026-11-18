import { headers } from 'next/headers'

import { appAuth } from '@/lib/app-auth'
import { toStoreUserWithSpend } from '@/lib/loyalty-lifetime'
import { getStoreData } from '@/lib/store-data'
import { StoreEntry } from '@/store/StoreEntry'

/**
 * Public storefront - everyone sees the shop.
 * - A signed-in customer gets the shop with their account.
 * - Visitors get the shop without account features (wishlist, saved addresses, order history).
 * - Admins can still access /admin directly via the URL.
 */
export default async function HomePage() {
  // Get customer session (may be null for visitors)
  const customer = await appAuth.currentUser()
  const data = await getStoreData()
  const user = customer ? await toStoreUserWithSpend(customer) : null

  return <StoreEntry data={data} user={user} />
}
