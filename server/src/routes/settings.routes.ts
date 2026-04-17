import { Router } from 'express'
import {
  changePassword,
  getOverview,
  getRoles,
  updateProfile,
  updateRole,
} from '../controllers/settings.controller'
import { authMiddleware } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'

const router = Router()

router.use(authMiddleware)

router.get('/overview', requirePermission('settings.access'), getOverview)
router.get('/roles', requirePermission('settings.access'), getRoles)
router.put('/roles/:userId', requirePermission('settings.access'), updateRole)
router.put('/profile', updateProfile)
router.put('/password', changePassword)

export default router
