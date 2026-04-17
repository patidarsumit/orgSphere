import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { employeeQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as EmployeeService from '../services/employee.service'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = employeeQuerySchema.parse(req.query)
    const result = await EmployeeService.findAll(query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid employee query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch employees')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.findById(req.params.id)

    if (!user) {
      res.status(404).json({ message: 'Employee not found' })
      return
    }

    res.json(user)
  } catch {
    sendServerError(res, 'Failed to fetch employee')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.create(req.body, req.user?.id)
    res.status(201).json(EmployeeService.sanitize(user))
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      res.status(409).json({ message: 'Email already registered' })
      return
    }
    sendServerError(res, 'Failed to create employee')
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.update(req.params.id, req.body, req.user?.id)
    res.json(EmployeeService.sanitize(user))
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    sendServerError(res, 'Failed to update employee')
  }
}

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    const avatarPath = `uploads/avatars/${req.file.filename}`
    await EmployeeService.updateAvatar(req.params.id, avatarPath, req.user?.id)
    res.json({ avatar_path: avatarPath, url: `http://localhost:4000/${avatarPath}` })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    sendServerError(res, 'Failed to upload avatar')
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.user?.id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' })
      return
    }

    await EmployeeService.remove(req.params.id, req.user?.id)
    res.json({ message: 'Employee deactivated successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    sendServerError(res, 'Failed to deactivate employee')
  }
}

export const getSkills = async (_req: Request, res: Response): Promise<void> => {
  try {
    const skills = await EmployeeService.getUniqueSkills()
    res.json(skills)
  } catch {
    sendServerError(res, 'Failed to fetch skills')
  }
}
