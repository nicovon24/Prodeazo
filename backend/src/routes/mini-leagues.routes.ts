import { Router } from 'express'
import * as miniLeaguesController from '../controllers/mini-leagues.controller'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// Public — must be registered before requireAuth middleware
router.get('/invite/:token', asyncHandler(miniLeaguesController.getInviteInfo))

router.use(requireAuth)

router.get('/mine', asyncHandler(miniLeaguesController.mine))
router.post('/', asyncHandler(miniLeaguesController.create))
router.get('/:id', asyncHandler(miniLeaguesController.detail))
router.post('/:id/join', asyncHandler(miniLeaguesController.join))
router.post('/join', asyncHandler(miniLeaguesController.join))
router.delete('/:id', asyncHandler(miniLeaguesController.deleteLeague))
router.delete('/:id/leave', asyncHandler(miniLeaguesController.leave))
router.delete('/:id/members/:userId', asyncHandler(miniLeaguesController.removeMember))
router.post('/:id/invite', asyncHandler(miniLeaguesController.generateInvite))
router.post('/join-by-token', asyncHandler(miniLeaguesController.joinByToken))
router.get('/:id/leaderboard', asyncHandler(miniLeaguesController.leaderboard))

export default router
