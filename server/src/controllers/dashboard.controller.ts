import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User)
    const teamRepo = AppDataSource.getRepository(Team)
    const projectRepo = AppDataSource.getRepository(Project)
    const [totalProjects, totalEmployees, activeTeams] = await Promise.all([
      projectRepo.count(),
      userRepo.count({ where: { is_active: true } }),
      teamRepo.count(),
    ])

    res.json({
      totalProjects,
      totalEmployees,
      activeTeams,
      myOpenTasks: 0,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
