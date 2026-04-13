import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  manager_id: z.string().uuid().nullable().optional(),
})

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']),
  department: z.string().nullable(),
  skills: z.array(z.string()),
  avatar_path: z.string().nullable(),
  manager_id: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserResponse = z.infer<typeof userResponseSchema>

