import { z } from 'zod'

const userRoleSchema = z.enum(['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer'])

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema.default('employee'),
  department: z.string().max(255).optional(),
  skills: z.array(z.string()).default([]),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
})

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  role: userRoleSchema.optional(),
  department: z.string().max(255).nullable().optional(),
  skills: z.array(z.string()).optional(),
  manager_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
})

export const employeeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  skill: z.string().optional(),
  department: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>
