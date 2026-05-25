import type { RequestHandler } from 'express'
import { Router } from 'express'
import passport, { isGoogleOAuthEnabled } from '../config/passport'
import * as authController from '../controllers/auth.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

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
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get(
  '/callback',
  requireGoogleOAuth,
  passport.authenticate('google', {
    failureRedirect: `${frontendUrl}/login`,
    failureMessage: true,
    session: false,
  }),
  authController.oauthCallbackSuccess
)

router.get('/exchange', asyncHandler(authController.exchangeCode))

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.localLogin))
router.post('/logout', requireAuth, asyncHandler(authController.logout))

router.get('/me', requireAuth, asyncHandler(authController.me))

export default router
