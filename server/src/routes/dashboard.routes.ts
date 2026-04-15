import { Router } from 'express'
import { getStats } from '../controllers/dashboard.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/stats', authMiddleware, getStats)

export default router

