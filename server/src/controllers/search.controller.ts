import { Response } from 'express'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = String(req.query.q || '').trim()

    if (!q || q.length < 2) {
      res.json({ query: q, projects: [], employees: [], teams: [], total: 0 })
      return
    }

    const pattern = `%${q}%`
    const limit = 5

    const [projects, employees, teams] = await Promise.all([
      AppDataSource.getRepository(Project)
        .createQueryBuilder('project')
        .leftJoin('project.manager', 'manager')
        .select([
          'project.id',
          'project.name',
          'project.status',
          'project.tech_stack',
          'project.updated_at',
          'manager.id',
          'manager.name',
        ])
        .where('project.name ILIKE :pattern', { pattern })
        .orderBy('project.updated_at', 'DESC')
        .take(limit)
        .getMany(),
      AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.role',
          'user.avatar_path',
          'user.department',
        ])
        .where('(user.name ILIKE :pattern OR user.email ILIKE :pattern)', { pattern })
        .andWhere('user.is_active = true')
        .orderBy('user.name', 'ASC')
        .take(limit)
        .getMany(),
      AppDataSource.getRepository(Team)
        .createQueryBuilder('team')
        .leftJoin('team.members', 'member')
        .select(['team.id', 'team.name', 'team.description', 'member.id'])
        .where('team.name ILIKE :pattern', { pattern })
        .orderBy('team.name', 'ASC')
        .take(limit)
        .getMany(),
    ])

    res.json({
      query: q,
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        tech_stack: project.tech_stack,
        manager_name: project.manager?.name ?? null,
        type: 'project',
      })),
      employees: employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        avatar_path: employee.avatar_path,
        department: employee.department,
        type: 'employee',
      })),
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        member_count: team.members?.length ?? 0,
        type: 'team',
      })),
      total: projects.length + employees.length + teams.length,
    })
  } catch {
    res.status(500).json({ message: 'Search failed' })
  }
}
