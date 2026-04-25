import { z } from 'zod'

export const postStatusEnum = z.enum(['draft', 'published', 'archived'])

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).default({}),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: postStatusEnum.default('draft'),
  reading_time: z.coerce.number().min(1).default(1),
})

export const updatePostSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: postStatusEnum.optional(),
  reading_time: z.coerce.number().min(1).optional(),
})

export const postQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(9),
  tag: z.string().optional(),
  status: postStatusEnum.optional(),
  search: z.string().optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostQuery = z.infer<typeof postQuerySchema>
export type PostStatus = z.infer<typeof postStatusEnum>
