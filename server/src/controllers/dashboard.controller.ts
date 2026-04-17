import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'
import { getRecentGlobal } from '../services/activity.service'
import * as TaskService from '../services/task.service'
import { formatMany } from '../utils/activity.formatter'

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User)
    const teamRepo = AppDataSource.getRepository(Team)
    const projectRepo = AppDataSource.getRepository(Project)
    const [totalProjects, totalEmployees, activeTeams, myOpenTasks, recentActivity] = await Promise.all([
      projectRepo.count(),
      userRepo.count({ where: { is_active: true } }),
      teamRepo.count(),
      TaskService.countOpenByUser(req.user!.id),
      getRecentGlobal(8),
    ])

    res.json({
      totalProjects,
      totalEmployees,
      activeTeams,
      myOpenTasks,
      recentActivity: formatMany(recentActivity),
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
