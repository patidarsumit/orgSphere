import { z } from 'zod'

export const projectStatusEnum = z.enum([
  'active',
  'completed',
  'on_hold',
  'planned',
  'archived',
])

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(255),
  description: z.string().max(2000).optional(),
  status: projectStatusEnum.default('active'),
  tech_stack: z.array(z.string()).default([]),
  start_date: z.string().optional(),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
  tech_lead_id: z.string().uuid('Invalid tech lead ID').nullable().optional(),
  team_id: z.string().uuid('Invalid team ID').nullable().optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: projectStatusEnum.optional(),
  tech_stack: z.array(z.string()).optional(),
  start_date: z.string().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  tech_lead_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
})

export const addProjectMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.string().max(100).default('Member'),
})

export const projectQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  tech: z.string().optional(),
  team_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type ProjectQuery = z.infer<typeof projectQuerySchema>
export type ProjectStatus = z.infer<typeof projectStatusEnum>
