import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { googleOAuthConfig, getGoogleAuthUrl } from '@/lib/google-oauth'

function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function handleOAuthInit(next?: string) {
  const state = generateState()

  // Build auth URL with next parameter in state
  const authUrl = getGoogleAuthUrl(state)

  // Add next URL to the callback URL
  const url = new URL(authUrl)
  if (next) {
    url.searchParams.set('next', next)
  }

  // Store state and next in cookies for verification
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

  if (next) {
    cookieStore.set('oauth_next', next, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    })
  }

  return url.toString()
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const next = url.searchParams.get('next') || '/'

    const authUrl = await handleOAuthInit(next)
    return redirect(authUrl)
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors (they're not real errors, just how Next.js does redirects)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Google OAuth login error:', error)
    return redirect('/#/login?error=oauth_failed')
  }
}

export async function POST(request: Request) {
  try {
    const { next } = await request.json()

    const authUrl = await handleOAuthInit(next)

    return Response.json({ url: authUrl })
  } catch (error) {
    console.error('Google OAuth login error:', error)
    return Response.json({ error: 'Failed to initiate Google OAuth' }, { status: 500 })
  }
}