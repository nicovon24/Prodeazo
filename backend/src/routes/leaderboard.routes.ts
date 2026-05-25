import { Router } from 'express'
import * as leaderboardController from '../controllers/leaderboard.controller'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(leaderboardController.list))

export default router
