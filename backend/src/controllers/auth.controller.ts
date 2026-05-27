import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import passport from '../config/passport'
import { err } from '../utils/apiError'
import { signToken } from '../utils/jwt'
import { getCache, setCache, deleteCache } from '../services/cache.service'
import * as passwordResetModel from '../models/password-reset.model'
import * as userModel from '../models/user.model'
import { sendPasswordResetEmail } from '../services/email.service'
import { env } from '../env'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

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
  if (env.NODE_ENV !== 'production') {
    console.log('[auth] OAuth callback success, user:', req.user?.id)
  }

  const token = signToken(userToPayload(req.user!))
  const code = randomUUID()
  setCache(`oauth_code:${code}`, token, 60)

  res.redirect(`${env.FRONTEND_URL}/auth/callback?code=${code}`)
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
  const user = await userModel.findById(userId)
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

  const updated = await userModel.updateById(userId, setData)
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
  const user = await userModel.findById(sessionUser.id)

  if (!user?.passwordHash) {
    return res.status(403).json(err('FORBIDDEN', 'No se puede cambiar la contraseña de esta cuenta'))
  }

  const match = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!match) {
    return res.status(401).json(err('UNAUTHORIZED', 'La contraseña actual no es correcta'))
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await userModel.updateById(user.id, { passwordHash })

  res.json({ ok: true })
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input'))
  }

  const { email, password, name } = parsed.data

  const exists = await userModel.existsByEmail(email)
  if (exists) {
    return res.status(409).json(err('CONFLICT', 'Email already in use'))
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const newUser = await userModel.createUser({ email, name, passwordHash, authProvider: 'local' })

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
  await userModel.deleteById(userId)
  res.json({ ok: true })
}

/**
 * POST /api/auth/forgot-password
 * Sends a password-reset email. Works for both local and Google accounts.
 * Always responds 200 to avoid email enumeration.
 */
export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', 'Ingresá un email válido'))
  }

  const user = await userModel.findByEmail(parsed.data.email)

  // Always respond 200 — don't reveal whether the email exists
  if (!user) {
    return res.json({ ok: true })
  }

  await passwordResetModel.invalidatePreviousTokens(user.id)
  const resetToken = await passwordResetModel.createResetToken(user.id)

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken.token}`
  const isFirstTime = user.authProvider === 'google' && !user.passwordHash

  try {
    await sendPasswordResetEmail(user.email, resetUrl, isFirstTime)
  } catch (emailErr) {
    console.error('[auth] Failed to send password reset email:', emailErr)
    // Don't surface the error to the client
  }

  res.json({ ok: true })
}

/**
 * POST /api/auth/reset-password
 * Atomically consumes the token and sets a new password.
 * Uses consumeToken() to eliminate the TOCTOU race between validation and marking used.
 */
export async function resetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(err('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input'))
  }

  // Atomically consume the token — returns null if already used, expired, or not found
  const consumed = await passwordResetModel.consumeToken(parsed.data.token)
  if (!consumed) {
    return res.status(404).json(err('NOT_FOUND', 'Este link ya venció o fue usado. Pedí uno nuevo.'))
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  await userModel.updateById(consumed.userId, { passwordHash })

  res.json({ ok: true })
}
