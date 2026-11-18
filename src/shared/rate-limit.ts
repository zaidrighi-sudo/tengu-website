/**
 * Small in-memory rate limiter for server actions and route handlers.
 *
 * It lives in the process, so it protects a single instance. That is enough to
 * stop naive password guessing and form spam; a multi-instance deployment
 * should move these counters to Redis (or Upstash) behind the same functions.
 */

type Options = { max: number; windowMs: number }

const buckets = new Map<string, number[]>()
const SWEEP_THRESHOLD = 5_000

function prune(key: string, windowMs: number, now: number): number[] {
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  if (hits.length > 0) buckets.set(key, hits)
  else buckets.delete(key)
  return hits
}

function sweep(now: number) {
  if (buckets.size < SWEEP_THRESHOLD) return
  for (const [key, hits] of buckets) {
    const newest = hits[hits.length - 1] ?? 0
    if (now - newest > 60 * 60 * 1000) buckets.delete(key)
  }
}

export type LimitState =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number }

/** Reads the counter without counting this call. */
export function checkLimit(key: string, options: Options): LimitState {
  const now = Date.now()
  const hits = prune(key, options.windowMs, now)
  if (hits.length < options.max) return { ok: true, remaining: options.max - hits.length }
  const oldest = hits[0] ?? now
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)),
  }
}

/** Counts one attempt right away, then reports whether it is allowed. */
export function takeToken(key: string, options: Options): LimitState {
  const now = Date.now()
  sweep(now)
  const hits = prune(key, options.windowMs, now)
  if (hits.length >= options.max) {
    const oldest = hits[0] ?? now
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)),
    }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { ok: true, remaining: options.max - hits.length }
}

/** Counts one failed attempt (used by login, where only failures matter). */
export function recordFailure(key: string, windowMs: number) {
  const now = Date.now()
  const hits = prune(key, windowMs, now)
  hits.push(now)
  buckets.set(key, hits)
}

/** Clears a counter, for example after a successful login. */
export function clearLimit(key: string) {
  buckets.delete(key)
}

/** "Try again in 3 minutes." style hint for the storefront copy. */
export function retryMessage(seconds: number) {
  const minutes = Math.ceil(seconds / 60)
  if (minutes <= 1) return 'Please try again in a minute.'
  return `Please try again in ${minutes} minutes.`
}
