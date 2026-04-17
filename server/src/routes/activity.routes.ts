import { Router } from 'express'
import {
  getEntityFeed,
  getGlobalFeed,
  getRecentFeed,
  getUnreadCount,
  markAllRead,
} from '../controllers/activity.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/recent', getRecentFeed)
router.get('/unread-count', getUnreadCount)
router.post('/mark-read', markAllRead)
router.get('/:entity_type/:entity_id', getEntityFeed)
router.get('/', getGlobalFeed)

export default router
