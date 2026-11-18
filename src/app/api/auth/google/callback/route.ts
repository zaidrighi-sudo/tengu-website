import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { connectDB, User } from '@/shared/mongodb/models'
import { createAppAuth } from '@/features/auth/app-auth'
import { googleOAuthConfig, getGoogleAuthUrl, type GoogleUserInfo } from '@/features/auth/google-oauth'

// Generate a random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Handle OAuth errors - these are early returns, not in try block
  if (error) {
    console.error('Google OAuth error:', error)
    return redirect('/#/login?error=oauth_failed')
  }

  if (!code) {
    return redirect('/#/login?error=no_code')
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(googleOAuthConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleOAuthConfig.clientId,
        client_secret: googleOAuthConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: googleOAuthConfig.callbackUrl,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return redirect('/#/login?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch user info from Google
    const userInfoResponse = await fetch(googleOAuthConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info')
      return redirect('/#/login?error=user_info_failed')
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json()

    if (!googleUser.verified_email) {
      return redirect('/#/login?error=email_not_verified')
    }

    // Connect to database
    await connectDB()

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

    // Create session using the appAuth's loginWithGoogle method
    const appAuth = createAppAuth()
    await appAuth.loginWithGoogle(googleUser)

    // Redirect to home or next page
    const nextUrl = url.searchParams.get('next') || '/'
    return redirect(nextUrl)

  } catch (error) {
    // Re-throw NEXT_REDIRECT errors (they're not real errors, just how Next.js does redirects)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Google OAuth callback error:', error)
    return redirect('/#/login?error=callback_failed')
  }
}

// Also export a route handler for initiating Google OAuth
export async function POST(request: Request) {
  const state = generateState()
  const authUrl = getGoogleAuthUrl(state)

  // Store state in cookie for verification (optional, for CSRF protection)
  // Use secure cookies only in production (HTTPS), not on localhost (HTTP)
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })

  return Response.json({ url: authUrl })
}