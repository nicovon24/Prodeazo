import { Router } from 'express'
import * as fixturesController from '../controllers/fixtures.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/', requireAuth, asyncHandler(fixturesController.list))
router.get('/live', requireAuth, asyncHandler(fixturesController.live))
router.get('/standings', requireAuth, asyncHandler(fixturesController.standings))

export default router
