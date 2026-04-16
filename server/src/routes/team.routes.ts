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
import { adminOnly, authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/', getAll)
router.get('/user/:userId', getByUser)
router.get('/:id', getOne)
router.post('/', validate(createTeamSchema), create)
router.put('/:id', validate(updateTeamSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', validate(addTeamMemberSchema), addMember)
router.delete('/:id/members/:userId', removeMember)

export default router
