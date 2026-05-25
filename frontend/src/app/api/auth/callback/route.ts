import { type NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'https://prodeazo.onrender.com'

/**
 * Proxies the Google OAuth callback to the backend and forwards the
 * Set-Cookie header to the browser. Vercel rewrites strip Set-Cookie from
 * upstream responses, so this route handler is needed to properly persist
 * the session cookie on the vercel.app domain.
 */
export async function GET(req: NextRequest) {
  const renderRes = await fetch(
    `${BACKEND}/api/auth/callback${req.nextUrl.search}`,
    { redirect: 'manual' }
  )

  const location = renderRes.headers.get('location') ?? '/'
  const res = NextResponse.redirect(new URL(location, req.url))

  renderRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      res.headers.append('set-cookie', value)
    }
  })

  return res
}
