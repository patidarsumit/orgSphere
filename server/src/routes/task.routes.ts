import { Router } from 'express'
import { createTaskSchema, updateTaskSchema } from '@orgsphere/schemas'
import {
  create,
  getMyTasks,
  getOne,
  getProjectTasks,
  getToday,
  remove,
  update,
} from '../controllers/task.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/today', getToday)
router.get('/project/:projectId', getProjectTasks)
router.get('/', getMyTasks)
router.get('/:id', getOne)
router.post('/', validate(createTaskSchema), create)
router.put('/:id', validate(updateTaskSchema), update)
router.delete('/:id', remove)

export default router
