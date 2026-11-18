'use server'

import { appAuth } from '@/lib/app-auth'
import { toStoreUserWithSpend } from '@/lib/loyalty-lifetime'
import { connectDB, User } from '@/lib/mongodb/models'
import type { User as StoreUser } from '@/store/context/AuthContext'
import { hashPassword } from '@/lib/passwords'
import { addressKey } from '@/lib/request-key'
import {
  checkLimit,
  clearLimit,
  recordFailure,
  retryMessage,
  takeToken,
} from '@/lib/rate-limit'

const SIGN_IN_WINDOW = 15 * 60 * 1000
const SIGN_IN_MAX = 8
const SIGN_UP_WINDOW = 60 * 60 * 1000
const SIGN_UP_MAX = 10

export type AuthResult =
  | { ok: true; user: StoreUser; isAdmin?: false }
  | { ok: true; isAdmin: true; redirectTo: '/manage/dashboard' }
  | { ok: false; field?: string; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

function passwordProblem(value: string) {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.'
  return ''
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = clean(input?.email, 200).toLowerCase()
  const password = typeof input?.password === 'string' ? input.password : ''

  // Only failed attempts are counted, so a busy shared connection cannot lock
  // out customers who sign in normally.
  const key = await addressKey('sign-in')
  const gate = checkLimit(key, { max: SIGN_IN_MAX, windowMs: SIGN_IN_WINDOW })
  if (!gate.ok) {
    return {
      ok: false,
      message: `Too many sign-in attempts. ${retryMessage(gate.retryAfterSeconds)}`,
    }
  }

  // First try customer login (users collection)
  try {
    const user = await appAuth.login(email, password)
    clearLimit(key)
    return { ok: true, user: await toStoreUserWithSpend(user), isAdmin: false }
  } catch {
    // Customer login failed, try admin login
    try {
      const { adminAuth } = await import('@/lib/admin-auth')
      await adminAuth.login(email, password)
      clearLimit(key)
      return { ok: true, isAdmin: true, redirectTo: '/manage/dashboard' }
    } catch {
      // Both failed - note the failure so repeated guessing is slowed down.
      recordFailure(key, SIGN_IN_WINDOW)
      return {
        ok: false,
        message: 'We could not find an account with that email and password. Check both and try again.',
      }
    }
  }
}

export async function signUp(input: {
  firstName: string
  lastName: string
  email: string
  password: string
  marketing: boolean
}): Promise<AuthResult> {
  const email = clean(input?.email, 200).toLowerCase()
  const firstName = clean(input?.firstName, 80)
  const lastName = clean(input?.lastName, 80)
  const password = typeof input?.password === 'string' ? input.password : ''
  if (!firstName) return { ok: false, field: 'firstName', message: 'Enter your first name.' }
  if (!lastName) return { ok: false, field: 'lastName', message: 'Enter your last name.' }
  if (!EMAIL.test(email)) return { ok: false, field: 'email', message: 'Enter a valid email address.' }
  const problem = passwordProblem(password)
  if (problem) return { ok: false, field: 'password', message: problem }

  // Creating accounts is the other cheap abuse target.
  const gate = takeToken(await addressKey('sign-up'), {
    max: SIGN_UP_MAX,
    windowMs: SIGN_UP_WINDOW,
  })
  if (!gate.ok) {
    return { ok: false, message: `Too many accounts created from here. ${retryMessage(gate.retryAfterSeconds)}` }
  }

  try {
    await connectDB()
    const existing = await User.findOne({ email })
    if (existing) {
      return { ok: false, field: 'email', message: 'An account with this email already exists. Try signing in.' }
    }
    await User.create({
      email,
      password: await hashPassword(password),
      firstName,
      lastName,
      marketing: Boolean(input?.marketing),
    })
    const user = await appAuth.login(email, password)
    return { ok: true, user: await toStoreUserWithSpend(user) }
  } catch {
    return { ok: false, message: 'We could not create your account. Please try again.' }
  }
}

export async function signOut(): Promise<void> {
  await appAuth.logout()
}

/**
 * Fresh copy of the signed-in customer straight from the database. The
 * session cookie is a JWT minted at sign-in time, so the lifetime delivered
 * spend (loyalty reward progress) is re-read from the DB on demand.
 */
export async function getSessionUser(): Promise<
  { ok: true; user: StoreUser } | { ok: false; message: string }
> {
  const current = await appAuth.currentUser()
  if (!current) return { ok: false, message: 'Not signed in.' }
  try {
    await connectDB()
    const doc = await User.findById(current.id)
      .select('email firstName lastName phone marketing createdAt addresses avatar provider')
      .lean()
    if (!doc) return { ok: false, message: 'Account not found.' }
    const record = doc as Record<string, unknown> & { _id: { toString(): string } }
    const appUser = {
      id: record._id.toString(),
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      marketing: record.marketing,
      addresses: record.addresses,
      createdAt: new Date((record.createdAt as string | Date | undefined) ?? Date.now()),
      avatar: record.avatar,
      provider: record.provider,
    } as Parameters<typeof toStoreUserWithSpend>[0]
    return { ok: true, user: await toStoreUserWithSpend(appUser) }
  } catch {
    return { ok: false, message: 'We could not refresh your session.' }
  }
}

export type AccountInput = {
  firstName: string
  lastName: string
  phone: string
  marketing: boolean
  addresses: {
    label: string
    isDefault: boolean
    firstName: string
    lastName: string
    phone: string
    region: string
    city: string
    address1: string
    address2: string
  }[]
}

/** Save the signed-in customer's profile and addresses. */
export async function saveAccount(input: AccountInput): Promise<AuthResult> {
  const current = await appAuth.currentUser()
  if (!current) return { ok: false, message: 'Please sign in again.' }
  try {
    await connectDB()
    const addresses = (Array.isArray(input?.addresses) ? input.addresses : []).slice(0, 20).map((address) => ({
      label: clean(address?.label, 60) || 'Address',
      isDefault: Boolean(address?.isDefault),
      firstName: clean(address?.firstName, 80),
      lastName: clean(address?.lastName, 80),
      phone: clean(address?.phone, 30),
      region: clean(address?.region, 80),
      city: clean(address?.city, 120),
      address1: clean(address?.address1, 240),
      address2: clean(address?.address2, 240),
    }))
    const updated = await User.findByIdAndUpdate(
      current.id,
      {
        firstName: clean(input?.firstName, 80) || current.firstName,
        lastName: clean(input?.lastName, 80) || current.lastName,
        phone: clean(input?.phone, 30),
        marketing: Boolean(input?.marketing),
        addresses,
      },
      { new: true }
    )
    if (!updated) return { ok: false, message: 'User not found.' }
    return { ok: true, user: await toStoreUserWithSpend({
      id: updated._id.toString(),
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      marketing: updated.marketing,
      addresses: updated.addresses,
      createdAt: updated.createdAt,
    }) }
  } catch {
    return { ok: false, message: 'We could not save your changes. Please try again.' }
  }
}

export async function changePassword(input: { current: string; next: string }): Promise<AuthResult> {
  const current = await appAuth.currentUser()
  if (!current) return { ok: false, message: 'Please sign in again.' }
  const next = typeof input?.next === 'string' ? input.next : ''
  const problem = passwordProblem(next)
  if (problem) return { ok: false, field: 'newPassword', message: problem }
  try {
    // Check the current password by attempting to login
    await appAuth.login(current.email, String(input?.current ?? ''))
  } catch {
    return { ok: false, field: 'currentPassword', message: 'That is not your current password.' }
  }
  try {
    await connectDB()
    const updated = await User.findByIdAndUpdate(
      current.id,
      { password: await hashPassword(next) },
      { new: true },
    )
    if (!updated) return { ok: false, message: 'User not found.' }
    return { ok: true, user: await toStoreUserWithSpend({
      id: updated._id.toString(),
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      marketing: updated.marketing,
      addresses: updated.addresses,
      createdAt: updated.createdAt,
    }) }
  } catch {
    return { ok: false, message: 'We could not update your password. Please try again.' }
  }
}

export async function loginWithGoogle(input: { next?: string }): Promise<{ ok: true; redirectTo: string } | { ok: false; message: string }> {
  const next = input?.next || '/'
  // Return the Google OAuth login URL - the client will redirect to it
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectTo = `${baseUrl}/api/auth/google/login?next=${encodeURIComponent(next)}`
  return { ok: true, redirectTo }
}