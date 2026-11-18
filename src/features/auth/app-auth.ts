import 'server-only'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { connectDB, User, type IUser } from '@/shared/mongodb/models'
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '@/features/auth/passwords'
import { jwtSecret } from '@/features/auth/jwt-secret'

const COOKIE = 'app-session'
const MAX_AGE = 60 * 60 * 24 * 7
const secret = () => jwtSecret('APP_JWT_SECRET', 'fallback-app-secret-change-in-production')

export interface AppUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  marketing: boolean
  addresses: IAddress[]
  createdAt: Date
  avatar?: string
  provider?: string
}

export interface IAddress {
  label: string
  isDefault: boolean
  firstName?: string
  lastName?: string
  phone?: string
  region?: string
  city?: string
  address1?: string
  address2?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

/**
 * Shop customer sessions, kept apart from the Admin session.
 * Uses JWT tokens stored in httpOnly cookies.
 */
export function createAppAuth() {
  async function setSession(token: string) {
    ;(await cookies()).set(COOKIE, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      partitioned: true,
      path: '/',
      maxAge: MAX_AGE,
    })
  }

  async function createToken(user: IUser): Promise<string> {
    return new SignJWT({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      marketing: user.marketing,
      addresses: user.addresses,
      avatar: user.avatar,
      provider: user.provider,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret())
  }

  async function verifyToken(token: string): Promise<AppUser | null> {
    try {
      const { payload } = await jwtVerify(token, secret())
      return payload as unknown as AppUser
    } catch {
      return null
    }
  }

  return {
    /** The signed-in customer, or null. */
    async currentUser(): Promise<AppUser | null> {
      const token = (await cookies()).get(COOKIE)?.value
      if (!token) return null
      return verifyToken(token)
    },

    async login(email: string, password: string) {
      await connectDB()

      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user) {
        // Keep the timing similar to a real check so emails cannot be probed.
        await verifyPassword(password, DUMMY_PASSWORD_HASH)
        throw new Error('Invalid email or password')
      }

      const check = await verifyPassword(password, user.password)
      if (!check.ok) {
        throw new Error('Invalid email or password')
      }

      // Accounts created before hashing existed store the plaintext password.
      // Replace it now that it has been proven correct.
      if (check.needsUpgrade) {
        await User.updateOne(
          { _id: user._id },
          { $set: { password: await hashPassword(password) } },
        ).catch(() => undefined)
      }

      const token = await createToken(user)
      await setSession(token)

      return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        marketing: user.marketing,
        addresses: user.addresses,
        createdAt: user.createdAt,
        avatar: user.avatar,
        provider: user.provider,
      }
    },

    async loginWithGoogle(googleUser: GoogleUserInfo) {
      await connectDB()

      if (!googleUser.verified_email) {
        throw new Error('Email not verified with Google')
      }

      // Check if user exists with this Google ID
      let user = await User.findOne({ googleId: googleUser.id })

      if (!user) {
        // Check if user exists with this email (local account)
        user = await User.findOne({ email: googleUser.email.toLowerCase() })

        if (user) {
          // Link Google account to existing local account
          user.googleId = googleUser.id
          user.provider = 'google'
          user.avatar = googleUser.picture
          await user.save()
        } else {
          // Create new user with Google account
          user = await User.create({
            email: googleUser.email.toLowerCase(),
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            password: undefined, // No password for OAuth users
            marketing: false,
            addresses: [],
            googleId: googleUser.id,
            provider: 'google',
            avatar: googleUser.picture,
          })
        }
      }

      const token = await createToken(user)
      await setSession(token)

      return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        marketing: user.marketing,
        addresses: user.addresses,
        createdAt: user.createdAt,
        avatar: user.avatar,
        provider: user.provider,
      }
    },

    async logout() {
      ;(await cookies()).set(COOKIE, '', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        partitioned: true,
        path: '/',
        maxAge: 0,
      })
    },
  }
}

export const appAuth = createAppAuth()