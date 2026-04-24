import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { postQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as PostService from '../services/post.service'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

const parseQuery = (req: Request, res: Response) => {
  const result = postQuerySchema.safeParse(req.query)
  if (!result.success) {
    res.status(400).json({ message: 'Invalid post query', errors: result.error.flatten().fieldErrors })
    return null
  }
  return result.data
}

export const getPublished = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = parseQuery(req, res)
    if (!query) return
    res.json(await PostService.findPublished(query))
  } catch {
    sendServerError(res, 'Failed to fetch posts')
  }
}

export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.findBySlug(req.params.slug)
    if (!post) {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    res.json(post)
  } catch {
    sendServerError(res, 'Failed to fetch post')
  }
}

export const getTags = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json(await PostService.getAllTags())
  } catch {
    sendServerError(res, 'Failed to fetch tags')
  }
}

export const getFeatured = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json((await PostService.getFeatured()) ?? null)
  } catch {
    sendServerError(res, 'Failed to fetch featured post')
  }
}

export const getAllAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = parseQuery(req, res)
    if (!query) return
    res.json(await PostService.findAll(query, req.user))
  } catch {
    sendServerError(res, 'Failed to fetch posts')
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.findById(req.params.id)
    if (!post) {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    res.json(post)
  } catch {
    sendServerError(res, 'Failed to fetch post')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(201).json(await PostService.create(req.body, req.user?.id))
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Validation failed', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to create post')
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await PostService.update(req.params.id, req.body, req.user?.id))
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    sendServerError(res, 'Failed to update post')
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await PostService.remove(req.params.id, req.user?.id)
    res.json({ message: 'Post deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    sendServerError(res, 'Failed to delete post')
  }
}

export const publish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await PostService.publish(req.params.id, req.user?.id))
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    sendServerError(res, 'Failed to publish post')
  }
}

export const unpublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await PostService.unpublish(req.params.id, req.user?.id))
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    sendServerError(res, 'Failed to unpublish post')
  }
}
