import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(255),
  description: z.string().max(1000).optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
})

export const addTeamMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
})

export const teamQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  search: z.string().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>
export type TeamQuery = z.infer<typeof teamQuerySchema>
