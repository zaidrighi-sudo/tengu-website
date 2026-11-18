import 'server-only'

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing with Node's built-in scrypt, so no extra dependency is
 * needed. Stored format is self-describing, which lets the parameters be
 * raised later without invalidating existing hashes:
 *
 *   scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>
 */
const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>

const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64
const SALT_BYTES = 16

const HASH_PATTERN = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([0-9a-f]{32})\$([0-9a-f]{128})$/

/**
 * A valid hash of a value nobody uses. Verifying against it when the account
 * does not exist keeps the response time of unknown and wrong-password logins
 * similar, so the login form cannot be used to probe which emails exist.
 */
export const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$1299658d7edaad96468ffb3aecc0d261$5ba031dd4492aa789b0dbaa95bdc2f0e192e725c418a81004c454fae6f49c9bb6dacdf7007f8ce0d92aa58d95ad5c0ccf1fb2d7235e55bd903c3b0b0314e3864'

/** True when a stored value is already a scrypt hash from this module. */
export function isPasswordHash(value: string | null | undefined): boolean {
  return typeof value === 'string' && HASH_PATTERN.test(value)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const key = await scrypt(password, salt, KEY_LENGTH, PARAMS)
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('hex')}$${key.toString('hex')}`
}

export type PasswordCheck = {
  ok: boolean
  /** The stored value is a legacy plaintext password and should be replaced. */
  needsUpgrade: boolean
}

/**
 * Checks a password against its stored value.
 *
 * Rows created before hashing existed still contain the plaintext password.
 * They are compared as-is and flagged so the caller can transparently replace
 * them with a hash after a successful login.
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<PasswordCheck> {
  if (!stored) return { ok: false, needsUpgrade: false }

  const match = HASH_PATTERN.exec(stored)
  if (!match) {
    const given = Buffer.from(password, 'utf8')
    const saved = Buffer.from(stored, 'utf8')
    const ok = given.length === saved.length && timingSafeEqual(given, saved)
    return { ok, needsUpgrade: ok }
  }

  const [, N, r, p, saltHex, hashHex] = match
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  })
  const ok = actual.length === expected.length && timingSafeEqual(actual, expected)

  // Parameters below the current cost are upgraded on the next login.
  const outdated = Number(N) < PARAMS.N || Number(r) < PARAMS.r || Number(p) < PARAMS.p
  return { ok, needsUpgrade: ok && outdated }
}
