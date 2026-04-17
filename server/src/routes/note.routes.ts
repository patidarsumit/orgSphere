import { Router } from 'express'
import { createNoteSchema, updateNoteSchema } from '@orgsphere/schemas'
import { create, getMyNotes, getOne, getRecent, remove, update } from '../controllers/note.controller'
import { authMiddleware } from '../middleware/auth'
import { canManageNote } from '../middleware/permissions'
import { validate } from '../middleware/validate'

const router = Router()

router.use(authMiddleware)

router.get('/recent', getRecent)
router.get('/', getMyNotes)
router.get('/:id', canManageNote, getOne)
router.post('/', validate(createNoteSchema), create)
router.put('/:id', canManageNote, validate(updateNoteSchema), update)
router.delete('/:id', canManageNote, remove)

export default router
