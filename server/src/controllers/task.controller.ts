import { Response } from 'express'
import { ZodError } from 'zod'
import { taskQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as TaskService from '../services/task.service'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = taskQuerySchema.parse(req.query)
    const result = await TaskService.findByUser(req.user!.id, query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid task query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch tasks')
  }
}

export const getProjectTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = taskQuerySchema.parse({ ...req.query, project_id: req.params.projectId })
    const result = await TaskService.findByProject(req.params.projectId, query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid task query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch project tasks')
  }
}

export const getToday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await TaskService.getTodayByUser(req.user!.id)
    res.json(tasks)
  } catch {
    sendServerError(res, 'Failed to fetch today tasks')
  }
}

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.findById(req.params.id, req.user!.id, req.user!.role)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.json(task)
  } catch {
    sendServerError(res, 'Failed to fetch task')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.create(req.body, req.user!.id)
    res.status(201).json(task)
  } catch {
    sendServerError(res, 'Failed to create task')
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.update(req.params.id, req.user!.id, req.body, req.user!.role)
    res.json(task)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    sendServerError(res, 'Failed to update task')
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await TaskService.remove(req.params.id, req.user!.id, req.user!.role)
    res.json({ message: 'Task deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    sendServerError(res, 'Failed to delete task')
  }
}
