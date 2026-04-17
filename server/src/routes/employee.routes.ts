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
import { authMiddleware } from '../middleware/auth'
import { adminOnly, canCreateEmployee, canEditEmployee } from '../middleware/permissions'
import { avatarUpload } from '../middleware/upload'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/', getAll)
router.get('/skills', getSkills)
router.get('/:id', getOne)
router.post('/', canCreateEmployee, validate(createEmployeeSchema), create)
router.put('/:id', canEditEmployee, validate(updateEmployeeSchema), update)
router.post('/:id/avatar', canEditEmployee, avatarUpload.single('avatar'), uploadAvatar)
router.delete('/:id', adminOnly, remove)

export default router
