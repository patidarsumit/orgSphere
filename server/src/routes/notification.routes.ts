import { Router } from 'express'
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} from '../controllers/notification.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/unread-count', getUnreadCount)
router.post('/mark-read', markAllRead)
router.post('/:id/read', markOneRead)
router.get('/', getNotifications)

export default router
