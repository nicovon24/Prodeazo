import https from 'node:https'
import http from 'node:http'
import { type NextRequest } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? 'https://prodeazo.onrender.com'

/**
 * Proxies the Google OAuth callback to the backend and forwards the
 * Set-Cookie headers to the browser. Vercel rewrites strip Set-Cookie from
 * upstream responses, so this route handler is needed to properly persist
 * the session cookie on the vercel.app domain.
 *
 * Uses node:https directly (instead of Next.js-patched fetch) to avoid
 * issues with redirect:manual and to get set-cookie as a proper string[].
 */
export async function GET(req: NextRequest): Promise<Response> {
  const target = new URL(`/api/auth/callback${req.nextUrl.search}`, BACKEND)
  const mod = target.protocol === 'https:' ? https : http

  return new Promise<Response>((resolve) => {
    mod
      .get({ hostname: target.hostname, path: target.pathname + target.search }, (res) => {
        const location =
          res.headers.location ??
          process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ??
          'https://prodeazo.vercel.app'

        const rawCookies = res.headers['set-cookie']
        const cookies: string[] = Array.isArray(rawCookies)
          ? rawCookies
          : rawCookies
            ? [rawCookies]
            : []

        const out = new Headers({ location })
        cookies.forEach((c) => out.append('set-cookie', c))

        resolve(new Response(null, { status: 302, headers: out }))
      })
      .on('error', (e) => {
        console.error('[callback proxy] upstream error:', e)
        resolve(new Response('Auth callback failed', { status: 502 }))
      })
  })
}
