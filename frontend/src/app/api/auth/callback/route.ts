import { type NextRequest } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'https://prodeazo.onrender.com'

/**
 * Proxies the Google OAuth callback to the backend and forwards the
 * Set-Cookie headers to the browser. Vercel rewrites strip Set-Cookie from
 * upstream responses, so this route handler is needed to properly persist
 * the session cookie on the vercel.app domain.
 *
 * cookie-session sets two cookies (session + session.sig). We use
 * getSetCookie() instead of headers.forEach/get because the Fetch API
 * combines multiple Set-Cookie values into one string when accessed via
 * those methods, producing an unparseable cookie header in the browser.
 */
export async function GET(req: NextRequest) {
  const renderRes = await fetch(
    `${BACKEND}/api/auth/callback${req.nextUrl.search}`,
    { redirect: 'manual' }
  )

  const location = renderRes.headers.get('location') ?? '/'
  const absoluteLocation = new URL(location, req.url).toString()

  const resHeaders = new Headers()
  resHeaders.set('location', absoluteLocation)

  // getSetCookie() returns each Set-Cookie as a separate array entry,
  // preserving the two session cookies cookie-session sends.
  const setCookies: string[] =
    typeof (renderRes.headers as any).getSetCookie === 'function'
      ? (renderRes.headers as any).getSetCookie()
      : renderRes.headers.get('set-cookie')?.split(/,(?=[^ ])/) ?? []

  setCookies.forEach((c) => resHeaders.append('set-cookie', c))

  return new Response(null, { status: 302, headers: resHeaders })
}
