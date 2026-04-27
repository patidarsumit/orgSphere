import { Router } from 'express'
import { getInsights, getStats } from '../controllers/dashboard.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/stats', authMiddleware, getStats)
router.get('/insights', authMiddleware, getInsights)

export default router
