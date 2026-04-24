import { Router } from 'express'
import { createPostSchema, updatePostSchema } from '@orgsphere/schemas'
import {
  create,
  getAllAdmin,
  getById,
  getBySlug,
  getFeatured,
  getPublished,
  getTags,
  publish,
  remove,
  unpublish,
  update,
} from '../controllers/post.controller'
import { authMiddleware } from '../middleware/auth'
import { canAccessPosts, canManagePost, canPublishPosts } from '../middleware/permissions'
import { validate } from '../middleware/validate'

const router = Router()

router.get('/public', getPublished)
router.get('/public/featured', getFeatured)
router.get('/public/tags', getTags)
router.get('/public/:slug', getBySlug)

router.use(authMiddleware, canAccessPosts)
router.get('/', getAllAdmin)
router.get('/:id', canManagePost, getById)
router.post('/', validate(createPostSchema), create)
router.put('/:id', canManagePost, validate(updatePostSchema), update)
router.delete('/:id', canManagePost, remove)
router.post('/:id/publish', canPublishPosts, publish)
router.post('/:id/unpublish', canPublishPosts, unpublish)

export default router
