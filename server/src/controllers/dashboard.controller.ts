import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'
import * as TaskService from '../services/task.service'

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User)
    const teamRepo = AppDataSource.getRepository(Team)
    const projectRepo = AppDataSource.getRepository(Project)
    const [totalProjects, totalEmployees, activeTeams, myOpenTasks] = await Promise.all([
      projectRepo.count(),
      userRepo.count({ where: { is_active: true } }),
      teamRepo.count(),
      TaskService.countOpenByUser(req.user!.id),
    ])

    res.json({
      totalProjects,
      totalEmployees,
      activeTeams,
      myOpenTasks,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
