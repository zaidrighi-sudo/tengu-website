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

import { siteUrl } from '@/shared/site-url'

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  // Fall back to the deploy's own origin instead of hardcoding localhost, so
  // Google sign-in keeps working when only the domain changes.
  callbackUrl:
    process.env.GOOGLE_CALLBACK_URL || `${siteUrl()}/api/auth/google/callback`,
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: googleOAuthConfig.clientId,
    redirect_uri: googleOAuthConfig.callbackUrl,
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