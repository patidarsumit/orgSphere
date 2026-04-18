import { Router } from 'express'
import { createEmployeeSchema, updateEmployeeSchema } from '@orgsphere/schemas'
import {
  create,
  getAll,
  getOne,
  getSkills,
  remove,
  update,
  uploadAvatar,
} from '../controllers/employee.controller'
import { adminOnly, authMiddleware } from '../middleware/auth'
import { avatarUpload } from '../middleware/upload'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/', getAll)
router.get('/skills', getSkills)
router.get('/:id', getOne)
router.post('/', validate(createEmployeeSchema), create)
router.put('/:id', validate(updateEmployeeSchema), update)
router.post('/:id/avatar', avatarUpload.single('avatar'), uploadAvatar)
router.delete('/:id', adminOnly, remove)

export default router

