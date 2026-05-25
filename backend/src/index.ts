import './env'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { runScoreSync } from './jobs/score-sync'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
// import rateLimit from 'express-rate-limit'
import passport from './config/passport'
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

app.use(helmet())
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://prodeazo.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
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

// Passport only for OAuth strategy — no session middleware needed with JWT auth
app.use(passport.initialize())

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
