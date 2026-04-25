import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  project_id: z.string().uuid().optional().nullable(),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export const noteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  tag: z.string().optional(),
  project_id: z.string().uuid().optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteQuery = z.infer<typeof noteQuerySchema>
