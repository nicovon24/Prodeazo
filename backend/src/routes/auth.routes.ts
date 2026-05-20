import type { RequestHandler } from 'express'
import { Router } from 'express'
import passport, { isGoogleOAuthEnabled } from '../config/passport'
import * as authController from '../controllers/auth.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

const requireGoogleOAuth: RequestHandler = (_req, res, next) => {
  if (!isGoogleOAuthEnabled) {
    return res.status(503).json({
      error: 'Google OAuth is not configured',
      hint: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env (see .env.example).',
    })
  }
  next()
}

router.get(
  '/google',
  requireGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get(
  '/callback',
  requireGoogleOAuth,
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  authController.oauthCallbackSuccess
)

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.localLogin))
router.post('/logout', asyncHandler(authController.logout))

router.get('/me', asyncHandler(authController.me))
router.patch('/me', requireAuth, asyncHandler(authController.updateProfile))
router.delete('/me', requireAuth, asyncHandler(authController.deleteAccount))
router.post('/change-password', requireAuth, asyncHandler(authController.changePassword))

export default router
