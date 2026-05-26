import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import passport from '../config/passport'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { err } from '../utils/apiError'
import { signToken } from '../utils/jwt'
import { getCache, setCache, deleteCache } from '../services/cache.service'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(50),
})

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(50),
  avatar: z.string().max(2_000_000).optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

function userToPayload(user: Express.User) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
  }
}

function userToPublic(user: Express.User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    authProvider: user.authProvider,
  }
}

/**
 * Google OAuth success handler.
 * Issues a short-lived one-time code (60 s) instead of the JWT directly in the URL,
 * so the token never appears in server logs, browser history, or Referer headers.
 * The frontend exchanges the code for the real JWT via GET /api/auth/exchange.
 */
export function oauthCallbackSuccess(req: Request, res: Response) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[auth] OAuth callback success, user:', req.user?.id)
  }

  const token = signToken(userToPayload(req.user!))
  const code = randomUUID()
  setCache(`oauth_code:${code}`, token, 60)

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  res.redirect(`${frontendUrl}/auth/callback?code=${code}`)
}

/**
 * One-time code → JWT exchange for the OAuth flow.
 * Each code is single-use and expires after 60 s.
 */
export function exchangeCode(req: Request, res: Response) {
  const code = typeof req.query.code === 'string' ? req.query.code : null
  if (!code) {
    return res.status(400).json(err('BAD_REQUEST', 'Missing code'))
  }

  const token = getCache<string>(`oauth_code:${code}`)
  if (!token) {
    return res.status(400).json(err('BAD_REQUEST', 'Invalid or expired code'))
  }

  deleteCache(`oauth_code:${code}`)
  res.json({ token })
}

export function logout(_req: Request, res: Response) {
  res.json({ ok: true })
}

export async function me(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    return res.status(404).json(err('NOT_FOUND', 'User not found'))
  }
  res.json({ user: userToPublic(user) })
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input'))
  }

  const userId = (req.user as { id: string }).id
  const setData: Record<string, unknown> = { name: parsed.data.name }
  if (parsed.data.avatar !== undefined) {
    setData.avatar = parsed.data.avatar || null
  }
  const [updated] = await db
    .update(users)
    .set(setData)
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    return res.status(404).json(err('NOT_FOUND', 'User not found'))
  }

  const { id, email, name, avatar, authProvider } = updated
  res.json({ user: { id, email, name, avatar, authProvider } })
}

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input'))
  }

  const sessionUser = req.user as { id: string; authProvider?: string }

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1)
  if (!user?.passwordHash) {
    return res.status(403).json(err('FORBIDDEN', 'No se puede cambiar la contraseña de esta cuenta'))
  }

  const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!match) {
    return res.status(401).json(err('UNAUTHORIZED', 'La contraseña actual no es correcta'))
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id))

  res.json({ ok: true })
}

export async function register(req: Request, res: Response) {
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

  if (!newUser) throw new Error('Insert returned no user')

  const token = signToken(userToPayload(newUser))
  res.status(201).json({ user: userToPublic(newUser), token })
}

export function localLogin(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    'local',
    { session: false },
    (authErr: Error | null, user: Express.User | false) => {
      if (authErr) return next(authErr)
      if (!user) {
        return res.status(401).json(err('UNAUTHORIZED', 'Invalid email or password'))
      }
      const token = signToken(userToPayload(user))
      res.json({ user: userToPublic(user), token })
    }
  )(req, res, next)
}

export async function deleteAccount(req: Request, res: Response) {
  const userId = (req.user as { id: string }).id
  await db.delete(users).where(eq(users.id, userId))
  res.json({ ok: true })
}
