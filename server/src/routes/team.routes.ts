import { Router } from 'express'
import { addTeamMemberSchema, createTeamSchema, updateTeamSchema } from '@orgsphere/schemas'
import {
  addMember,
  create,
  getAll,
  getByUser,
  getOne,
  remove,
  removeMember,
  update,
} from '../controllers/team.controller'
import { authMiddleware } from '../middleware/auth'
import { adminOnly, canCreateTeam, canManageTeam } from '../middleware/permissions'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/', getAll)
router.get('/user/:userId', getByUser)
router.get('/:id', getOne)
router.post('/', canCreateTeam, validate(createTeamSchema), create)
router.put('/:id', canManageTeam, validate(updateTeamSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', canManageTeam, validate(addTeamMemberSchema), addMember)
router.delete('/:id/members/:userId', canManageTeam, removeMember)

export default router
