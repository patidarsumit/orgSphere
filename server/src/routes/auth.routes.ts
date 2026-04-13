import { Router } from 'express'
import { loginSchema, registerSchema } from '@orgsphere/schemas'
import { login, logout, me, refresh, register } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)

export default router

