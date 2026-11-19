/**
 * Google OAuth Configuration
 *
 * To enable Google OAuth:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select existing
 * 3. Enable Google OAuth API
 * 4. Create OAuth 2.0 credentials (Client ID and Secret)
 * 5. Add authorized redirect URI: https://yourdomain.com/api/auth/google/callback
 * 6. Add these environment variables:
 *    - GOOGLE_CLIENT_ID=your-client-id
 *    - GOOGLE_CLIENT_SECRET=your-client-secret
 *    - GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
 */

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
}

/**
 * The `redirect_uri` must be byte-for-byte identical in the authorization
 * request and the token exchange, and it must be whitelisted in Google Cloud
 * Console. Deriving it from the incoming request origin means it follows the
 * deployment domain (localhost, preview, production, custom domain) instead of
 * a stale environment variable that silently breaks sign-in after a deploy.
 *
 * `GOOGLE_CALLBACK_URL` is still honoured when its origin matches the current
 * request; a mismatching value (e.g. an old domain) is ignored on purpose.
 */
export function getGoogleCallbackUrl(requestUrl: string): string {
  const origin = new URL(requestUrl).origin
  const configured = process.env.GOOGLE_CALLBACK_URL
  if (configured) {
    try {
      if (new URL(configured).origin === origin) return configured
    } catch {
      // Malformed override: fall through to the derived URL.
    }
  }
  return `${origin}/api/auth/google/callback`
}

export function getGoogleAuthUrl(state: string, callbackUrl: string): string {
  const params = new URLSearchParams({
    client_id: googleOAuthConfig.clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: googleOAuthConfig.scope.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${googleOAuthConfig.authorizationUrl}?${params.toString()}`
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}