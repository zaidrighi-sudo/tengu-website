import 'server-only'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { connectDB, Admin, type IAdmin } from '@/shared/mongodb/models'
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '@/features/auth/passwords'
import { jwtSecret } from '@/features/auth/jwt-secret'

const COOKIE = 'admin-session'
const MAX_AGE = 60 * 60 * 24 * 7
const secret = () => jwtSecret('ADMIN_JWT_SECRET', 'fallback-secret-change-in-production')

export interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roles?: string[]
}

/**
 * Admin (staff) sessions for the custom admin dashboard.
 * Uses JWT tokens stored in httpOnly cookies.
 */
export function createAdminAuth() {
  async function setSession(token: string) {
    ;(await cookies()).set(COOKIE, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: MAX_AGE,
    })
  }

  async function createToken(admin: IAdmin): Promise<string> {
    return new SignJWT({
      id: admin._id.toString(),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      roles: admin.roles,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret())
  }

  async function verifyToken(token: string): Promise<AdminUser | null> {
    try {
      const { payload } = await jwtVerify(token, secret())
      return payload as unknown as AdminUser
    } catch {
      return null
    }
  }

  return {
    /** The signed-in admin, or null. */
    async currentUser(): Promise<AdminUser | null> {
      const token = (await cookies()).get(COOKIE)?.value
      if (!token) return null
      return verifyToken(token)
    },

    async login(email: string, password: string) {
      await connectDB()

      const admin = await Admin.findOne({ email: email.toLowerCase() })
      if (!admin) {
        // Same work as a real check, so unknown emails are not distinguishable.
        await verifyPassword(password, DUMMY_PASSWORD_HASH)
        throw new Error('Invalid email or password')
      }

      const check = await verifyPassword(password, admin.password)
      if (!check.ok) {
        throw new Error('Invalid email or password')
      }

      // Existing staff rows may still hold the plaintext password.
      if (check.needsUpgrade) {
        await Admin.updateOne(
          { _id: admin._id },
          { $set: { password: await hashPassword(password) } },
        ).catch(() => undefined)
      }

      const token = await createToken(admin)
      await setSession(token)

      return {
        id: admin._id.toString(),
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: admin.roles,
      }
    },

    async logout() {
      ;(await cookies()).set(COOKIE, '', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/',
        maxAge: 0,
      })
    },
  }
}

export const adminAuth = createAdminAuth()