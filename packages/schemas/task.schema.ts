import { z } from 'zod'

export const taskStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done'])
export const taskPriorityEnum = z.enum(['low', 'medium', 'high'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum.default('todo'),
  priority: taskPriorityEnum.default('medium'),
  due_date: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  due_date: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export const taskQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  project_id: z.string().uuid().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQuery = z.infer<typeof taskQuerySchema>
export type TaskStatus = z.infer<typeof taskStatusEnum>
export type TaskPriority = z.infer<typeof taskPriorityEnum>
