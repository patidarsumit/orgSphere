import { Request, Response } from 'express'
import { ZodError, z } from 'zod'
import { projectQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as ProjectService from '../services/project.service'

const memberRoleSchema = z.object({
  role: z.string().min(1).max(100),
})

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = projectQuerySchema.parse(req.query)
    const result = await ProjectService.findAll(query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid project query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch projects')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.findById(req.params.id)
    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    res.json(project)
  } catch {
    sendServerError(res, 'Failed to fetch project')
  }
}

export const getByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectService.findByUserId(req.params.userId)
    res.json(projects)
  } catch {
    sendServerError(res, 'Failed to fetch user projects')
  }
}

export const getByTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectService.findByTeamId(req.params.teamId)
    res.json(projects)
  } catch {
    sendServerError(res, 'Failed to fetch team projects')
  }
}

export const getRecent = async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectService.getRecentProjects(5)
    res.json(projects)
  } catch {
    sendServerError(res, 'Failed to fetch recent projects')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.create(req.body, req.user?.id, req.user?.role)
    res.status(201).json(project)
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions', action: 'projects.create' })
      return
    }
    sendServerError(res, 'Failed to create project')
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.update(req.params.id, req.body, req.user?.id, req.user?.role)
    res.json(project)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions', action: 'projects.manage' })
      return
    }
    sendServerError(res, 'Failed to update project')
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ProjectService.remove(req.params.id, req.user?.id, req.user?.role)
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions', action: 'projects.delete' })
      return
    }
    sendServerError(res, 'Failed to delete project')
  }
}

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.addMember(req.params.id, req.body, req.user?.id, req.user?.role)
    res.status(201).json(project)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const statusByMessage: Record<string, number> = {
      PROJECT_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      ALREADY_MEMBER: 409,
      FORBIDDEN: 403,
    }
    res.status(statusByMessage[message] || 500).json({
      message: message === 'FORBIDDEN' ? 'Insufficient permissions' : message,
      action: message === 'FORBIDDEN' ? 'projects.manage' : undefined,
    })
  }
}

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ProjectService.removeMember(req.params.id, req.params.userId, req.user?.id, req.user?.role)
    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Member not found' })
      return
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions', action: 'projects.manage' })
      return
    }
    sendServerError(res, 'Failed to remove member')
  }
}

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload = memberRoleSchema.parse(req.body)
    const project = await ProjectService.updateMemberRole(
      req.params.id,
      req.params.userId,
      payload.role,
      req.user?.id,
      req.user?.role
    )
    res.json(project)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid role', errors: error.flatten().fieldErrors })
      return
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Member not found' })
      return
    }
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions', action: 'projects.manage' })
      return
    }
    sendServerError(res, 'Failed to update member role')
  }
}
