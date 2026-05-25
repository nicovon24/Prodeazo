import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(requireAuth)
router.get('/me', asyncHandler(dashboardController.me))

export default router
