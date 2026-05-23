import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

const envDir = __dirname
loadEnv({ path: resolve(envDir, '.env'), override: true })
loadEnv({ path: resolve(envDir, '.env.local'), override: true })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
