import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import passport from '../config/passport'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { err } from '../utils/apiError'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
})

export function oauthCallbackSuccess(_req: Request, res: Response) {
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173')
}

export function logout(req: Request, res: Response, next: (err?: unknown) => void) {
  req.logout((logoutErr) => {
    if (logoutErr) return next(logoutErr)
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr)
      res.json({ ok: true })
    })
  })
}

export function me(req: Request, res: Response) {
  if (!req.isAuthenticated()) return res.status(401).json({ user: null })
  const { id, email, name, avatar, authProvider } = req.user as any
  res.json({ user: { id, email, name, avatar, authProvider } })
}

export async function register(req: Request, res: Response, next: NextFunction) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input'))
  }

  const { email, password, name } = parsed.data

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return res.status(409).json(err('CONFLICT', 'Email already in use'))
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [newUser] = await db
    .insert(users)
    .values({ email, name, passwordHash, authProvider: 'local' })
    .returning()

  req.login(newUser, (loginErr) => {
    if (loginErr) return next(loginErr)
    const { id, email: e, name: n, avatar, authProvider } = newUser
    res.status(201).json({ user: { id, email: e, name: n, avatar, authProvider } })
  })
}

export function localLogin(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    'local',
    (authErr: Error | null, user: Express.User | false) => {
      if (authErr) return next(authErr)
      if (!user) {
        return res.status(401).json(err('UNAUTHORIZED', 'Invalid email or password'))
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr)
        const { id, email, name, avatar, authProvider } = user as any
        res.json({ user: { id, email, name, avatar, authProvider } })
      })
    }
  )(req, res, next)
}
