import { Router } from 'express'
import * as teamsController from '../controllers/teams.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/', requireAuth, asyncHandler(teamsController.list))

export default router