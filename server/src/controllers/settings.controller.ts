import bcrypt from 'bcryptjs'
import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

const safeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  skills: user.skills,
  avatar_path: user.avatar_path,
  manager_id: user.manager_id,
  is_active: user.is_active,
  created_at: user.created_at.toISOString(),
  updated_at: user.updated_at?.toISOString(),
})

export const getOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalProjects, totalTeams] = await Promise.all([
      AppDataSource.getRepository(User).count({ where: { is_active: true } }),
      AppDataSource.getRepository(Project).count(),
      AppDataSource.getRepository(Team).count(),
    ])

    res.json({ totalUsers, totalProjects, totalTeams })
  } catch {
    res.status(500).json({ message: 'Failed to fetch overview' })
  }
}

export const getRoles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.avatar_path',
        'user.department',
        'user.is_active',
        'user.created_at',
        'user.updated_at',
      ])
      .orderBy('user.role', 'ASC')
      .addOrderBy('user.name', 'ASC')
      .getMany()

    res.json(users.map(safeUser))
  } catch {
    res.status(500).json({ message: 'Failed to fetch roles' })
  }
}

export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.body.role as User['role']
    const validRoles: User['role'][] = ['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer']

    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Invalid role' })
      return
    }

    if (req.params.userId === req.user!.id && role !== 'admin') {
      res.status(400).json({ message: 'Cannot change your own admin role' })
      return
    }

    const result = await AppDataSource.getRepository(User).update({ id: req.params.userId }, { role })
    if (!result.affected) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.json({ message: 'Role updated successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to update role' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({ where: { id: req.user!.id } })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const { name, department } = req.body as { name?: string; department?: string | null }
    if (name !== undefined && name.trim().length >= 2) user.name = name.trim()
    if (department !== undefined) user.department = department?.trim() || null

    const saved = await repo.save(user)
    res.json(safeUser(saved))
  } catch {
    res.status(500).json({ message: 'Failed to update profile' })
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body as {
      current_password?: string
      new_password?: string
    }
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({ where: { id: req.user!.id } })
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    const validCurrentPassword = await bcrypt.compare(current_password || '', user.password_hash)
    if (!validCurrentPassword) {
      res.status(400).json({ message: 'Current password is incorrect' })
      return
    }

    if (!new_password || new_password.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters' })
      return
    }

    user.password_hash = await bcrypt.hash(new_password, 12)
    await repo.save(user)
    res.json({ message: 'Password changed successfully' })
  } catch {
    res.status(500).json({ message: 'Failed to change password' })
  }
}
