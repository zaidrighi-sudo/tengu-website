import 'server-only'

/**
 * Signing keys for the session cookies.
 *
 * A missing or short secret used to silently fall back to a key that is
 * committed in the source, so anyone could mint an admin session. Production
 * now fails loudly instead; development keeps a local key so `pnpm dev` works
 * out of the box.
 */
const cache = new Map<string, Uint8Array>()

const MIN_LENGTH = 32
const isBuild = () => process.env.NEXT_PHASE === 'phase-production-build'

export function jwtSecret(name: 'APP_JWT_SECRET' | 'ADMIN_JWT_SECRET', devFallback: string): Uint8Array {
  const cached = cache.get(name)
  if (cached) return cached

  const value = process.env[name]
  if (value && value.length >= MIN_LENGTH) {
    const bytes = new TextEncoder().encode(value)
    cache.set(name, bytes)
    return bytes
  }

  if (process.env.NODE_ENV === 'production' && !isBuild()) {
    throw new Error(
      `${name} is missing or shorter than ${MIN_LENGTH} characters. ` +
        'Generate one with `node -e "console.log(require(\'node:crypto\').randomBytes(48).toString(\'hex\'))"` ' +
        'and set it in the production environment.',
    )
  }

  if (!isBuild()) {
    console.warn(
      `[auth] ${name} is not set, so a development key is in use. ` +
        'Set a real secret before deploying.',
    )
  }

  const bytes = new TextEncoder().encode(devFallback)
  cache.set(name, bytes)
  return bytes
}
