import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { requireAuth } from '../middleware/requireAuth'
import * as tournamentsController from '../controllers/tournaments.controller'

const router = Router()
router.use(requireAuth)
router.get('/', asyncHandler(tournamentsController.list))
router.get('/:id', asyncHandler(tournamentsController.getOne))
export default router
