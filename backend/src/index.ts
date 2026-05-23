import './env'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { runScoreSync } from './jobs/score-sync'
import session from 'express-session'
import { RedisStore } from 'connect-redis'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
// import rateLimit from 'express-rate-limit'
import passport from './config/passport'
import { redis } from './config/redis'
import authRoutes from './routes/auth.routes'
import teamsRoutes from './routes/teams.routes'
import fixturesRoutes from './routes/fixtures.routes'
import predictionsRoutes from './routes/predictions.routes'
import leaderboardRoutes from './routes/leaderboard.routes'
import miniLeaguesRoutes from './routes/mini-leagues.routes'
import tournamentsRoutes from './routes/tournaments.routes'

const app = express()
const PORT = process.env.PORT || 4000

// const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false })
// const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : 'dev-session-secret-not-for-production')

if (!sessionSecret) {
  throw new Error('SESSION_SECRET is required in production')
}

const sessionStoreEnv = process.env.SESSION_STORE?.trim().toLowerCase()
/** En desarrollo: memoria por defecto (sin Redis). En producción: Redis salvo SESSION_STORE=memory. */
const useMemorySessions =
  sessionStoreEnv === 'memory' ||
  (process.env.NODE_ENV !== 'production' && sessionStoreEnv !== 'redis')

if (useMemorySessions) {
  if (process.env.NODE_ENV !== 'production' && sessionStoreEnv !== 'memory') {
    console.warn(
      '[session] Using in-memory store in development (set SESSION_STORE=redis + run Redis for persistent sessions)'
    )
  } else {
    console.warn('[session] Using in-memory store (set SESSION_STORE=redis when Redis is available)')
  }
}

app.use(helmet())
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
  })
)

// app.use(globalLimiter)

app.use((_req, res, next) => {
  const id = randomUUID()
  res.setHeader('X-Request-Id', id)
  next()
})

const morganFormat =
  process.env.MORGAN_FORMAT ||
  (process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
app.use(morgan(morganFormat))

app.use(express.json())

app.use(
  session({
    ...(useMemorySessions
      ? {}
      : { store: new RedisStore({ client: redis }) }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })

)

app.use(passport.initialize())
app.use(passport.session())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', /* authLimiter, */ authRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/mini-leagues', miniLeaguesRoutes)
app.use('/api/fixtures', fixturesRoutes)
app.use('/api/predictions', predictionsRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/tournaments', tournamentsRoutes)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } })
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  void runScoreSync()
  setInterval(() => void runScoreSync(), 60_000)
})
