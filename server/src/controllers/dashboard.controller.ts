import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User)
    const totalEmployees = await userRepo.count({ where: { is_active: true } })

    res.json({
      totalProjects: 0,
      totalEmployees,
      activeTeams: 0,
      myOpenTasks: 0,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}

