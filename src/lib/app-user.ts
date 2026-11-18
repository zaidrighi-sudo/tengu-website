import type { AppUser } from '@/lib/app-auth'
import type { User } from '@/store/context/AuthContext'
import type { IAddress } from '@/lib/app-auth'

/** Mongoose customer record as the storefront's account shape. */
export function toStoreUser(user: AppUser, lifetimeSpent = 0): User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
    marketing: Boolean(user.marketing),
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    lifetimeSpent,
    addresses: (user.addresses ?? []).map((address: IAddress, index: number) => ({
      id: address.label?.replace(/\s+/g, '-').toLowerCase() ?? `address-${index}`,
      label: address.label,
      isDefault: Boolean(address.isDefault),
      country: 'DZ',
      firstName: address.firstName ?? '',
      lastName: address.lastName ?? '',
      address1: address.address1 ?? '',
      address2: address.address2 ?? '',
      city: address.city ?? '',
      region: address.region ?? '',
      postal: '',
      phone: address.phone ?? '',
    })),
  }
}