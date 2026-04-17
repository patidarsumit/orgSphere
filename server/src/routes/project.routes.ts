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
import { authMiddleware } from '../middleware/auth'
import { adminOnly, canCreateProject, canManageProject } from '../middleware/permissions'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/recent', getRecent)
router.get('/user/:userId', getByUser)
router.get('/team/:teamId', getByTeam)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', canCreateProject, validate(createProjectSchema), create)
router.put('/:id', canManageProject, validate(updateProjectSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', canManageProject, validate(addProjectMemberSchema), addMember)
router.put('/:id/members/:userId', canManageProject, updateMemberRole)
router.delete('/:id/members/:userId', canManageProject, removeMember)

export default router
