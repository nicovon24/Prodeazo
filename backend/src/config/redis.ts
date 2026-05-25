import Redis from 'ioredis'

const url = process.env.REDIS_URL || 'redis://localhost:6379'

/** Shared client for sessions (optional) and cache. */
export const redis = new Redis(url, {
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 10) return null
    return Math.min(times * 500, 8000)
  },
})

let lastRedisErrorLog = 0
redis.on('error', (err) => {
  const now = Date.now()
  if (now - lastRedisErrorLog > 10_000) {
    console.warn('[redis] %s (is Redis running at %s?)', err.message, url)
    lastRedisErrorLog = now
  }
})
