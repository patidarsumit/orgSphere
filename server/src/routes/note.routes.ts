import { Router } from 'express'
import { createNoteSchema, updateNoteSchema } from '@orgsphere/schemas'
import { create, getMyNotes, getOne, getRecent, remove, update } from '../controllers/note.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/recent', getRecent)
router.get('/', getMyNotes)
router.get('/:id', getOne)
router.post('/', validate(createNoteSchema), create)
router.put('/:id', validate(updateNoteSchema), update)
router.delete('/:id', remove)

export default router
