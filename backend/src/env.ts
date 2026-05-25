import { setDefaultResultOrder } from 'node:dns'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'

// Force IPv4 to avoid ENETUNREACH on hosts that resolve to IPv6 (e.g. Render)
setDefaultResultOrder('ipv4first')

const backendRoot = resolve(__dirname, '..')

/** `override: true` so values in .env / .env.local win over empty or stale shell vars (e.g. Windows user env). */
loadEnv({ path: resolve(backendRoot, '.env'), override: true })
loadEnv({ path: resolve(backendRoot, '.env.local'), override: true })

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'SESSION_SECRET']

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`)
  console.error('[startup] Copy .env.example to .env and fill in the values.')
  process.exit(1)
}
