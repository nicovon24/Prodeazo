import { Router } from 'express'
import * as predictionsController from '../controllers/predictions.controller'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(predictionsController.list))
router.post('/', asyncHandler(predictionsController.createOrUpdate))

export default router
