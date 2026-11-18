/**
 * Canonical public origin of the site, resolved at runtime on the server.
 * Priority: explicit NEXT_PUBLIC_SITE_URL (env / .env / deploy settings),
 * then Vercel's build-provided production/deployment URLs, then localhost.
 * Trailing slashes are stripped so callers can append paths safely.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  return raw.replace(/\/+$/, "")
}
