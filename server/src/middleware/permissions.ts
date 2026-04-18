import { NextFunction, Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { Task } from '../entities/Task'
import { Note } from '../entities/Note'
import { User } from '../entities/User'
import { UserRole } from '../entities/User'
import { can, isUserRole, PermissionAction } from '../permissions'
import { AuthRequest } from './auth'

const forbidden = (res: Response, message = 'Insufficient permissions', action?: PermissionAction): void => {
  res.status(403).json({ message, action })
}

const getRole = (req: AuthRequest): UserRole | null => {
  const role = req.user?.role
  return role && isUserRole(role) ? role : null
}

export const requirePermission =
  (action: PermissionAction) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = getRole(req)

    if (!req.user || !role) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!can(role, action)) {
      forbidden(res, 'Insufficient permissions', action)
      return
    }

    next()
  }

export const requireAnyRole =
  (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = getRole(req)

    if (!req.user || !role) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (!roles.includes(role)) {
      forbidden(res)
      return
    }

    next()
  }

export const adminOnly = requireAnyRole('admin')
export const managerOrAbove = requireAnyRole('admin', 'manager')
export const canCreateEmployee = requirePermission('employees.create')
export const canCreateProject = requirePermission('projects.create')
export const canCreateTeam = requirePermission('teams.create')

export const canEditEmployee = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const role = getRole(req)

  if (!req.user || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (can(role, 'employees.edit_any') || req.params.id === req.user.id) {
    next()
    return
  }

  forbidden(res, 'You can only edit your own profile', 'employees.edit_own')
}

export const canDeactivateEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const role = getRole(req)

  if (!req.user || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (!can(role, 'employees.deactivate')) {
    forbidden(res, 'Insufficient permissions', 'employees.deactivate')
    return
  }

  if (req.params.id === req.user.id) {
    res.status(400).json({ message: 'Cannot deactivate your own account' })
    return
  }

  const target = await AppDataSource.getRepository(User).findOne({ where: { id: req.params.id } })

  if (!target) {
    res.status(404).json({ message: 'Employee not found' })
    return
  }

  if (role === 'hr' && target.role === 'admin') {
    forbidden(res, 'Only admins can deactivate admin accounts', 'employees.deactivate')
    return
  }

  next()
}

export const canManageProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const role = getRole(req)

  if (!req.user || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (role === 'admin') {
    next()
    return
  }

  const project = await AppDataSource.getRepository(Project).findOne({
    where: { id: req.params.id },
  })

  if (!project) {
    res.status(404).json({ message: 'Project not found' })
    return
  }

  if (project.manager_id === req.user.id || project.tech_lead_id === req.user.id) {
    next()
    return
  }

  forbidden(res, 'Only the project manager or tech lead can perform this action', 'projects.manage')
}

export const canManageTeam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const role = getRole(req)

  if (!req.user || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (role === 'admin') {
    next()
    return
  }

  const team = await AppDataSource.getRepository(Team).findOne({
    where: { id: req.params.id },
  })

  if (!team) {
    res.status(404).json({ message: 'Team not found' })
    return
  }

  if (team.created_by === req.user.id) {
    next()
    return
  }

  forbidden(res, 'Only the team creator or admin can perform this action', 'teams.manage')
}

export const canManageTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const role = getRole(req)

  if (!req.user || !role) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (can(role, 'tasks.manage_any')) {
    next()
    return
  }

  const task = await AppDataSource.getRepository(Task).findOne({ where: { id: req.params.id } })

  if (!task) {
    res.status(404).json({ message: 'Task not found' })
    return
  }

  if (task.assigned_to === req.user.id) {
    next()
    return
  }

  forbidden(res, 'You can only manage your own tasks')
}

export const canManageNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const note = await AppDataSource.getRepository(Note).findOne({ where: { id: req.params.id } })

  if (!note) {
    res.status(404).json({ message: 'Note not found' })
    return
  }

  if (note.user_id === req.user.id) {
    next()
    return
  }

  forbidden(res, 'Notes are private to their owner', 'notes.manage_own')
}
