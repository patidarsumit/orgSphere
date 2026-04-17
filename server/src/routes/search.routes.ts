import { Router } from 'express'
import { globalSearch } from '../controllers/search.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.get('/', authMiddleware, globalSearch)

export default router
