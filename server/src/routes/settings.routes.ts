import { Router } from 'express'
import {
  changePassword,
  getOverview,
  getRoles,
  updateProfile,
  updateRole,
} from '../controllers/settings.controller'
import { adminOnly, authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/overview', adminOnly, getOverview)
router.get('/roles', adminOnly, getRoles)
router.put('/roles/:userId', adminOnly, updateRole)
router.put('/profile', updateProfile)
router.put('/password', changePassword)

export default router
