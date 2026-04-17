import { Router } from 'express'
import {
  addMember,
  create,
  getAll,
  getByTeam,
  getByUser,
  getOne,
  getRecent,
  remove,
  removeMember,
  update,
  updateMemberRole,
} from '../controllers/project.controller'
import { addProjectMemberSchema, createProjectSchema, updateProjectSchema } from '@orgsphere/schemas'
import { adminOnly, authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/recent', getRecent)
router.get('/user/:userId', getByUser)
router.get('/team/:teamId', getByTeam)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', validate(createProjectSchema), create)
router.put('/:id', validate(updateProjectSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', validate(addProjectMemberSchema), addMember)
router.put('/:id/members/:userId', updateMemberRole)
router.delete('/:id/members/:userId', removeMember)

export default router
