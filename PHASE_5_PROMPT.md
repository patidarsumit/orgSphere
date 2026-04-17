# OrgSphere — Phase 5 Prompt
# Projects Module (Backend + Frontend)
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phases 1 (auth), 2 (app shell), 3 (employees), and 4 (teams) are complete and working.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod, nuqs
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token + httpOnly refresh cookie — already working
- Shared Zod schemas: /packages/schemas/

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full auth system + User entity
- Employee module (full CRUD, directory, profile, avatar upload)
- Teams module (full CRUD, member management, directory, detail page)
- All shared UI components (StatCard, PageHeader, StatusBadge, Avatar, AvatarStack, EmptyState, LoadingSpinner, ConfirmDialog)
- App shell (Sidebar, Header, protected layout)
- Stub pages at /projects and /projects/[id]
- Seed data: 10 employees + 4 teams in PostgreSQL
- Types at client/types/index.ts

---

## TASK — Phase 5: Projects Module

Build the complete projects feature end to end:
1. Backend: Project + ProjectMember entities and migration
2. Backend: Projects CRUD API with member management and filtering
3. Frontend: Projects list page (table view with filters)
4. Frontend: Project detail page (tabbed: Overview / Team / Tasks placeholder / Notes placeholder)
5. Frontend: Add/Edit project modal with full form
6. Update employee profile to show assigned projects
7. Update team detail to show assigned projects
8. Update dashboard with real project count + recent projects
9. Seed: 4 sample projects with team and member assignments

---

## STEP 1 — Shared Zod schemas

### packages/schemas/project.schema.ts
```typescript
import { z } from 'zod'

export const projectStatusEnum = z.enum([
  'active', 'completed', 'on_hold', 'planned', 'archived'
])

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(255),
  description: z.string().max(2000).optional(),
  status: projectStatusEnum.default('active'),
  tech_stack: z.array(z.string()).default([]),
  start_date: z.string().optional(),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
  tech_lead_id: z.string().uuid('Invalid tech lead ID').nullable().optional(),
  team_id: z.string().uuid('Invalid team ID').nullable().optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: projectStatusEnum.optional(),
  tech_stack: z.array(z.string()).optional(),
  start_date: z.string().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  tech_lead_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
})

export const addProjectMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.string().max(100).default('Member'),
})

export const projectQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: projectStatusEnum.optional(),
  tech: z.string().optional(),
  team_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>
export type ProjectQuery = z.infer<typeof projectQuerySchema>
export type ProjectStatus = z.infer<typeof projectStatusEnum>
```

Update packages/schemas/index.ts to export from project.schema.ts.

---

## STEP 2 — Backend: Project and ProjectMember entities

### server/src/entities/Project.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { User } from './User'
import { Team } from './Team'
import { ProjectMember } from './ProjectMember'

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planned' | 'archived'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'on_hold', 'planned', 'archived'],
    default: 'active',
  })
  status!: ProjectStatus

  @Column({ type: 'jsonb', default: [] })
  tech_stack!: string[]

  @Column({ type: 'date', nullable: true })
  start_date!: string | null

  @Column({ type: 'uuid', nullable: true })
  manager_id!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null

  @Column({ type: 'uuid', nullable: true })
  tech_lead_id!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'tech_lead_id' })
  tech_lead!: User | null

  @Column({ type: 'uuid', nullable: true })
  team_id!: string | null

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null

  @OneToMany(() => ProjectMember, (pm) => pm.project, { cascade: true })
  project_members!: ProjectMember[]

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

### server/src/entities/ProjectMember.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm'
import { User } from './User'
import { Project } from './Project'

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  project_id!: string

  @ManyToOne(() => Project, (p) => p.project_members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project

  @Column({ type: 'uuid' })
  user_id!: string

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'varchar', length: 100, default: 'Member' })
  role!: string

  @CreateDateColumn()
  joined_at!: Date
}
```

### Update server/src/data-source.ts
Add Project and ProjectMember to entities array:
```typescript
import { Project } from './entities/Project'
import { ProjectMember } from './entities/ProjectMember'

entities: [User, Team, Project, ProjectMember],
```

---

## STEP 3 — Backend: Migration

Generate and run migration:
```bash
cd server
npm run migration:generate -- -n CreateProjectsTables
npm run migration:run
```

Migration should create:
```sql
CREATE TYPE project_status AS ENUM ('active','completed','on_hold','planned','archived');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'active',
  tech_stack JSONB DEFAULT '[]',
  start_date DATE,
  manager_id UUID REFERENCES users(id),
  tech_lead_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'Member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

---

## STEP 4 — Backend: Project service

### server/src/services/project.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { ProjectMember } from '../entities/ProjectMember'
import { User } from '../entities/User'
import { Team } from '../entities/Team'
import { ILike } from 'typeorm'
import {
  CreateProjectInput, UpdateProjectInput,
  AddProjectMemberInput, ProjectQuery
} from '@orgsphere/schemas'

const repo = () => AppDataSource.getRepository(Project)
const pmRepo = () => AppDataSource.getRepository(ProjectMember)

const selectProjectFields = (alias: string) => [
  `${alias}.id`, `${alias}.name`, `${alias}.description`,
  `${alias}.status`, `${alias}.tech_stack`, `${alias}.start_date`,
  `${alias}.manager_id`, `${alias}.tech_lead_id`, `${alias}.team_id`,
  `${alias}.created_at`, `${alias}.updated_at`,
]

export const findAll = async (query: ProjectQuery) => {
  const { page, limit, search, status, tech, team_id, manager_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('project')
    .leftJoin('project.manager', 'manager')
    .leftJoin('project.tech_lead', 'lead')
    .leftJoin('project.team', 'team')
    .leftJoin('project.project_members', 'pm')
    .leftJoin('pm.user', 'member')
    .select([
      ...selectProjectFields('project'),
      'manager.id', 'manager.name', 'manager.avatar_path',
      'lead.id', 'lead.name', 'lead.avatar_path',
      'team.id', 'team.name',
      'pm.id', 'pm.role',
      'member.id', 'member.name', 'member.avatar_path',
    ])
    .skip(skip)
    .take(limit)
    .orderBy('project.created_at', 'DESC')

  if (search) {
    qb = qb.where('project.name ILIKE :search', { search: `%${search}%` })
  }
  if (status) {
    qb = qb.andWhere('project.status = :status', { status })
  }
  if (tech) {
    qb = qb.andWhere("project.tech_stack::text ILIKE :tech", { tech: `%${tech}%` })
  }
  if (team_id) {
    qb = qb.andWhere('project.team_id = :team_id', { team_id })
  }
  if (manager_id) {
    qb = qb.andWhere('project.manager_id = :manager_id', { manager_id })
  }

  const [projects, total] = await qb.getManyAndCount()

  return {
    data: projects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.manager', 'manager')
    .leftJoinAndSelect('project.tech_lead', 'lead')
    .leftJoinAndSelect('project.team', 'team')
    .leftJoinAndSelect('project.project_members', 'pm')
    .leftJoinAndSelect('pm.user', 'member')
    .select([
      ...selectProjectFields('project'),
      'manager.id', 'manager.name', 'manager.avatar_path', 'manager.role',
      'lead.id', 'lead.name', 'lead.avatar_path', 'lead.role',
      'team.id', 'team.name', 'team.description',
      'pm.id', 'pm.role', 'pm.joined_at',
      'member.id', 'member.name', 'member.avatar_path',
      'member.role', 'member.department',
    ])
    .where('project.id = :id', { id })
    .getOne()
}

export const findByUserId = async (userId: string) => {
  return pmRepo()
    .createQueryBuilder('pm')
    .innerJoinAndSelect('pm.project', 'project')
    .leftJoinAndSelect('project.team', 'team')
    .where('pm.user_id = :userId', { userId })
    .select([
      'pm.id', 'pm.role',
      'project.id', 'project.name', 'project.status',
      'project.tech_stack', 'project.description',
      'team.id', 'team.name',
    ])
    .getMany()
}

export const findByTeamId = async (teamId: string) => {
  return repo()
    .createQueryBuilder('project')
    .leftJoin('project.manager', 'manager')
    .select([
      'project.id', 'project.name', 'project.status',
      'project.tech_stack', 'project.description', 'project.start_date',
      'manager.id', 'manager.name',
    ])
    .where('project.team_id = :teamId', { teamId })
    .getMany()
}

export const create = async (input: CreateProjectInput) => {
  const project = repo().create(input)
  return repo().save(project)
}

export const update = async (id: string, input: UpdateProjectInput) => {
  const project = await repo().findOne({ where: { id } })
  if (!project) throw new Error('NOT_FOUND')
  Object.assign(project, input)
  return repo().save(project)
}

export const remove = async (id: string) => {
  const project = await repo().findOne({ where: { id } })
  if (!project) throw new Error('NOT_FOUND')
  await repo().remove(project)
}

export const addMember = async (projectId: string, input: AddProjectMemberInput) => {
  const existing = await pmRepo().findOne({
    where: { project_id: projectId, user_id: input.user_id }
  })
  if (existing) throw new Error('ALREADY_MEMBER')

  const pm = pmRepo().create({
    project_id: projectId,
    user_id: input.user_id,
    role: input.role,
  })
  return pmRepo().save(pm)
}

export const removeMember = async (projectId: string, userId: string) => {
  const pm = await pmRepo().findOne({
    where: { project_id: projectId, user_id: userId }
  })
  if (!pm) throw new Error('NOT_FOUND')
  await pmRepo().remove(pm)
}

export const getRecentProjects = async (limit = 5) => {
  return repo()
    .createQueryBuilder('project')
    .leftJoin('project.manager', 'manager')
    .leftJoin('project.tech_lead', 'lead')
    .leftJoin('project.project_members', 'pm')
    .leftJoin('pm.user', 'member')
    .select([
      'project.id', 'project.name', 'project.status',
      'project.tech_stack', 'project.created_at',
      'manager.id', 'manager.name', 'manager.avatar_path',
      'lead.id', 'lead.name', 'lead.avatar_path',
      'pm.id',
      'member.id', 'member.name', 'member.avatar_path',
    ])
    .orderBy('project.created_at', 'DESC')
    .take(limit)
    .getMany()
}
```

---

## STEP 5 — Backend: Project controller

### server/src/controllers/project.controller.ts
```typescript
import { Request, Response } from 'express'
import * as ProjectService from '../services/project.service'
import { projectQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = projectQuerySchema.parse(req.query)
    const result = await ProjectService.findAll(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects' })
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project' })
  }
}

export const getByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await ProjectService.findByUserId(req.params.userId)
    res.json(members)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user projects' })
  }
}

export const getByTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectService.findByTeamId(req.params.teamId)
    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team projects' })
  }
}

export const getRecent = async (_req: Request, res: Response): Promise<void> => {
  try {
    const projects = await ProjectService.getRecentProjects(5)
    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recent projects' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.create(req.body)
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await ProjectService.update(req.params.id, req.body)
    res.json(project)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update project' })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProjectService.remove(req.params.id)
    res.json({ message: 'Project deleted' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Project not found' })
      return
    }
    res.status(500).json({ message: 'Failed to delete project' })
  }
}

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const pm = await ProjectService.addMember(req.params.id, req.body)
    res.status(201).json(pm)
  } catch (error: any) {
    if (error.message === 'ALREADY_MEMBER') {
      res.status(409).json({ message: 'User is already a member' })
      return
    }
    res.status(500).json({ message: 'Failed to add member' })
  }
}

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    await ProjectService.removeMember(req.params.id, req.params.userId)
    res.json({ message: 'Member removed' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Member not found' })
      return
    }
    res.status(500).json({ message: 'Failed to remove member' })
  }
}
```

---

## STEP 6 — Backend: Project routes

### server/src/routes/project.routes.ts
```typescript
import { Router } from 'express'
import {
  getAll, getOne, getByUser, getByTeam, getRecent,
  create, update, remove, addMember, removeMember
} from '../controllers/project.controller'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createProjectSchema, updateProjectSchema, addProjectMemberSchema
} from '@orgsphere/schemas'

const router = Router()

router.use(authMiddleware)

// IMPORTANT: specific routes before param routes
router.get('/recent', getRecent)
router.get('/user/:userId', getByUser)
router.get('/team/:teamId', getByTeam)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', validate(createProjectSchema), create)
router.put('/:id', validate(updateProjectSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', validate(addProjectMemberSchema), addMember)
router.delete('/:id/members/:userId', removeMember)

export default router
```

Register in server/src/app.ts:
```typescript
import projectRoutes from './routes/project.routes'
app.use('/api/projects', projectRoutes)
```

### Update dashboard controller
```typescript
import { Project } from '../entities/Project'

const projectRepo = AppDataSource.getRepository(Project)
const totalProjects = await projectRepo.count()
const activeProjects = await projectRepo.count({ where: { status: 'active' } })

res.json({
  totalProjects,
  totalEmployees,
  activeTeams,
  myOpenTasks: 0,   // Phase 6
})
```

---

## STEP 7 — Backend: Seed projects

### server/src/seeds/projects.seed.ts
```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { ProjectMember } from '../entities/ProjectMember'
import { User } from '../entities/User'
import { Team } from '../entities/Team'

async function seed() {
  await AppDataSource.initialize()

  const userRepo    = AppDataSource.getRepository(User)
  const teamRepo    = AppDataSource.getRepository(Team)
  const projectRepo = AppDataSource.getRepository(Project)
  const pmRepo      = AppDataSource.getRepository(ProjectMember)

  const sumit  = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const raj    = await userRepo.findOne({ where: { email: 'raj@orgsphere.io' } })
  const priya  = await userRepo.findOne({ where: { email: 'priya@orgsphere.io' } })
  const vikram = await userRepo.findOne({ where: { email: 'vikram@orgsphere.io' } })
  const neha   = await userRepo.findOne({ where: { email: 'neha@orgsphere.io' } })
  const ananya = await userRepo.findOne({ where: { email: 'ananya@orgsphere.io' } })
  const rahul  = await userRepo.findOne({ where: { email: 'rahul@orgsphere.io' } })
  const amit   = await userRepo.findOne({ where: { email: 'amit@orgsphere.io' } })

  const platformTeam = await teamRepo.findOne({ where: { name: 'Platform Team' } })
  const productTeam  = await teamRepo.findOne({ where: { name: 'Product Team' } })
  const mobileTeam   = await teamRepo.findOne({ where: { name: 'Mobile Team' } })

  const projectsData = [
    {
      name: 'Alpha Platform',
      description: 'Core infrastructure platform rebuild. Migrating monolith to microservices architecture with improved scalability and observability.',
      status: 'active' as const,
      tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'],
      start_date: '2024-01-15',
      manager_id: sumit?.id,
      tech_lead_id: raj?.id,
      team_id: platformTeam?.id,
      members: [
        { user: sumit, role: 'Project Manager' },
        { user: raj, role: 'Tech Lead' },
        { user: vikram, role: 'Backend Developer' },
        { user: neha, role: 'Frontend Developer' },
        { user: rahul, role: 'DevOps Engineer' },
      ],
    },
    {
      name: 'Beta Analytics Dashboard',
      description: 'Real-time analytics and reporting dashboard for business intelligence. Includes custom chart builder and automated report generation.',
      status: 'in_progress' as const,
      tech_stack: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Redis'],
      start_date: '2024-02-01',
      manager_id: priya?.id,
      tech_lead_id: raj?.id,
      team_id: platformTeam?.id,
      members: [
        { user: priya, role: 'Product Manager' },
        { user: raj, role: 'Tech Lead' },
        { user: vikram, role: 'Data Engineer' },
        { user: ananya, role: 'UI Designer' },
      ],
    },
    {
      name: 'OrgSphere Mobile App',
      description: 'Native mobile application for iOS and Android. Provides on-the-go access to org visibility, tasks, and team communication.',
      status: 'planned' as const,
      tech_stack: ['React Native', 'Expo', 'TypeScript', 'Node.js'],
      start_date: '2024-04-01',
      manager_id: amit?.id,
      tech_lead_id: neha?.id,
      team_id: mobileTeam?.id,
      members: [
        { user: amit, role: 'Project Manager' },
        { user: neha, role: 'Lead Developer' },
        { user: vikram, role: 'Backend Developer' },
        { user: ananya, role: 'UI Designer' },
      ],
    },
    {
      name: 'Design System v2',
      description: 'Comprehensive component library and design system. Standardizes UI across all OrgSphere products with accessibility built in.',
      status: 'active' as const,
      tech_stack: ['React', 'TypeScript', 'Storybook', 'Figma'],
      start_date: '2024-01-20',
      manager_id: priya?.id,
      tech_lead_id: ananya?.id,
      team_id: productTeam?.id,
      members: [
        { user: priya, role: 'Product Manager' },
        { user: ananya, role: 'Lead Designer' },
        { user: neha, role: 'Frontend Developer' },
      ],
    },
  ]

  for (const pd of projectsData) {
    const exists = await projectRepo.findOne({ where: { name: pd.name } })
    if (exists) {
      console.log(`⏭️  Skipped (exists): ${pd.name}`)
      continue
    }

    const { members, ...projectData } = pd
    const project = projectRepo.create(projectData as any)
    const saved = await projectRepo.save(project)

    for (const m of members) {
      if (!m.user) continue
      const pm = pmRepo.create({
        project_id: saved.id,
        user_id: m.user.id,
        role: m.role,
      })
      await pmRepo.save(pm)
    }

    console.log(`✅ Created project: ${pd.name} with ${members.length} members`)
  }

  console.log('🌱 Projects seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add to server/package.json scripts:
```json
"seed:projects": "ts-node src/seeds/projects.seed.ts"
```

Run: `npm run seed:projects`

---

## STEP 8 — Frontend: Update types

### Add to client/types/index.ts
```typescript
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  user: User
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  tech_stack: string[]
  start_date: string | null
  manager_id: string | null
  tech_lead_id: string | null
  team_id: string | null
  manager: User | null
  tech_lead: User | null
  team: { id: string; name: string } | null
  project_members: ProjectMember[]
  created_at: string
  updated_at: string
}

export interface UserProject {
  id: string
  role: string
  project: {
    id: string
    name: string
    status: ProjectStatus
    tech_stack: string[]
    description: string | null
    team: { id: string; name: string } | null
  }
}
```

---

## STEP 9 — Frontend: Projects API hooks

### client/hooks/useProjects.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Project, UserProject, PaginatedResponse } from '@/types'

export interface ProjectFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  tech?: string
  team_id?: string
}

export const useProjects = (filters: ProjectFilters = {}) => {
  return useQuery<PaginatedResponse<Project>>({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/projects?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

export const useProject = (id: string) => {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useRecentProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects-recent'],
    queryFn: async () => {
      const { data } = await api.get('/projects/recent')
      return data
    },
    staleTime: 60_000,
  })
}

export const useUserProjects = (userId: string) => {
  return useQuery<UserProject[]>({
    queryKey: ['user-projects', userId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/user/${userId}`)
      return data
    },
    enabled: !!userId,
  })
}

export const useTeamProjects = (teamId: string) => {
  return useQuery<Project[]>({
    queryKey: ['team-projects', teamId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/team/${teamId}`)
      return data
    },
    enabled: !!teamId,
  })
}

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post('/projects', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects-recent'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export const useUpdateProject = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.put(`/projects/${id}`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', id] })
      qc.invalidateQueries({ queryKey: ['projects-recent'] })
    },
  })
}

export const useAddProjectMember = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { user_id: string; role: string }) => {
      const { data } = await api.post(`/projects/${projectId}/members`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export const useRemoveProjectMember = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/projects/${projectId}/members/${userId}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/projects/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['projects-recent'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
```

---

## STEP 10 — Frontend: TechStack chip component

### components/shared/TechStackChip.tsx
```typescript
// Props: tech (string), size? ('sm'|'md')
// Deterministic color based on tech name:
//   React/Next.js → blue
//   Node.js/Express/Fastify → green
//   Python/FastAPI/Django → amber
//   TypeScript/JavaScript → blue
//   PostgreSQL/MySQL → teal
//   Docker/Kubernetes → purple
//   Redis → red
//   default → gray
// Style: rounded-full pill, 11px font, color bg + text
// sm: compact (px-2 py-0.5), md: standard (px-3 py-1)
```

---

## STEP 11 — Frontend: Projects list page

### app/(app)/projects/page.tsx

Replace stub with full projects list page matching Stitch design.

```
Page layout:
- PageHeader:
    title="Projects"
    subtitle="{total} projects across {teamCount} teams"
    actions: "+ Add Project" button (opens ProjectFormModal)

FILTER BAR (below header, white card):
  [Search input          ] [Status ▾] [Tech Stack chips] [Clear filters]

  Search: nuqs ?search=, debounced 300ms, placeholder "Filter by name, lead, or manager..."
  Status dropdown (nuqs: ?status=):
    Options: All Projects / Active / Completed / On Hold / Planned / Archived
  Tech Stack filter: nuqs ?tech=
    Show as clickable chips: React • TypeScript • Node.js • Python (from common tech in projects)
    Active chip = indigo filled, inactive = gray outlined
  "Clear filters" link: only when any filter is active

PROJECTS TABLE:
Columns:
  PROJECT NAME | DESCRIPTION | STATUS | TECH STACK | TEAM | LEAD/MGR | ACTIONS

Row details:
  PROJECT NAME:
    - Colored status dot (6px circle, matches status color) left of name
    - Project name (14px/500, clickable → /projects/:id)
    - Clicking name navigates to project detail

  DESCRIPTION:
    - Truncated to 55 chars with ellipsis
    - Gray text (13px)

  STATUS:
    - StatusBadge component
    - active=green, completed=gray, on_hold=amber, planned=blue, archived=gray

  TECH STACK:
    - First 2 TechStackChip components (sm size)
    - "+N" gray badge if more than 2

  TEAM:
    - Team name chip (gray bg, 12px)
    - "—" if no team assigned

  LEAD/MGR:
    - Two stacked rows:
        Avatar (20px) + Lead name (12px)
        Avatar (20px) + Manager name (12px, gray)
    - "—" if not assigned

  ACTIONS:
    - 3-dot menu (MoreHorizontal icon)
    - Dropdown: "View Details" / "Edit" / divider / "Delete" (red)

Row styles:
  - Height: 56px
  - Hover: bg-gray-50
  - Cursor: pointer on row click → /projects/:id

PAGINATION:
  - "Showing 1–10 of 24 results"
  - Previous / page numbers / Next
  - nuqs: ?page=

LOADING STATE:
  - 5 skeleton table rows

EMPTY STATE:
  - EmptyState with FolderKanban icon
  - "No projects yet" / "No projects match your filters"
  - "+ Create your first project" button
```

---

## STEP 12 — Frontend: Project detail page

### app/(app)/projects/[id]/page.tsx

Replace stub with full project detail page matching Stitch design.

```
HEADER SECTION:
  - Back button: "← Projects"
  - Status badge (top, small)
  - Project name (28px/700)
  - Description (16px, gray-600, max 3 lines)
  - Share button + "Edit Project" button (top right)

HORIZONTAL TABS (sticky below header on scroll):
  Overview | Team | Tasks | Notes | Activity

  Tasks tab: shows "coming in Phase 6" placeholder
  Notes tab: shows "coming in Phase 6" placeholder
  Activity tab: shows "coming in Phase 7" placeholder

OVERVIEW TAB:
Two column layout (2/3 left + 1/3 right):

LEFT:
  Project Mission section:
    - Full description in a light gray box (rounded-lg, bg-gray-50, p-4)

  Tech Stack section:
    - "Tech Stack" label
    - TechStackChip components (md size) in a flex-wrap row

  Core Team section:
    - "Core Team" heading + "View All Members" link (switches to Team tab)
    - 2x2 grid of member cards:
        Each: Avatar (48px) + Name (14px/500) + Role on project (12px, gray)
        Max 4 shown, rest shown on Team tab
    - Empty: "No team members assigned"

RIGHT (sticky sidebar card):
  Project Info card (white, rounded-xl, border):
    PROJECT MANAGER:  Avatar + name (clickable → /employees/:id)
    TECH LEAD:        Avatar + name (clickable → /employees/:id)
    START DATE:       Formatted date or "—"
    TEAM:             Team chip (clickable → /teams/:id)

TEAM TAB:
  - Full member list
  - Each member: Avatar (40px) + Name + Role on project + Department
  - "Remove from project" button (hover, admin only)
  - "+ Add Member" button → inline search (same as teams module)
  - Member role is editable inline (click role text → input)

LOADING STATE:
  - Skeleton layout matching the two-column structure

404 STATE:
  - EmptyState + "Back to Projects"
```

---

## STEP 13 — Frontend: Project form modal

### components/projects/ProjectFormModal.tsx

```
Props:
  open: boolean
  onClose: () => void
  project?: Project  (edit mode if provided)

Form fields (React Hook Form + createProjectSchema):

Row 1: Project Name (required, full width)
Row 2: Description (textarea, 3 rows)
Row 3: Status (select) | Start Date (date picker)
Row 4: Tech Stack (tag input — same pattern as skills in employee form)
Row 5: Team (select from teams list — shows team name)
Row 6: Manager (select from employees — Avatar + Name)
       Tech Lead (select from employees — Avatar + Name)

Tech Stack input:
  - Type tech name + Enter/comma to add
  - Each shown as TechStackChip with × remove
  - Pre-populate common options: React, Node.js, TypeScript, Python, PostgreSQL, Docker

Team select:
  - Dropdown of all teams
  - Shows team name + member count
  - "No team" option

Manager / Tech Lead selects:
  - Searchable dropdown of all active employees
  - Shows Avatar + Name + Role

Submit:
  - Create: "Create Project"
  - Edit: "Save Changes"
  - Loading spinner + disabled while pending

On success:
  - Close modal + success toast
  - Create mode: navigate to new project's detail page
  - Edit mode: stay on detail page with updated data
```

---

## STEP 14 — Frontend: Update dashboard with real project data

### Update app/(app)/dashboard/page.tsx

Replace the placeholder "Recent Projects" section with real data:

```typescript
// Add useRecentProjects hook
const { data: recentProjects, isLoading: projectsLoading } = useRecentProjects()

// Replace skeleton rows with real project list items:
// Each row: colored status dot + project name + status badge + tech chips + avatar stack + lead name
// Clicking row → /projects/:id
// "View All Projects" link → /projects
```

Also update the stat cards:
- "Total Projects" → shows real count from dashboard stats API
- The dashboard API already returns totalProjects after Step 6 update

---

## STEP 15 — Frontend: Update employee profile with real projects

### Update app/(app)/employees/[id]/page.tsx

Replace the "Assigned Projects placeholder" with real data:

```typescript
// Add useUserProjects hook
const { data: userProjects } = useUserProjects(id)

// Show project cards:
// Each: project name + status badge + role on project + team name
// Clicking → /projects/:id
// Empty: "Not assigned to any projects"
// Loading: 2 skeleton cards
```

---

## STEP 16 — Frontend: Update team detail with real projects

### Update app/(app)/teams/[id]/page.tsx

Replace the "Assigned Projects placeholder" with real data:

```typescript
// Add useTeamProjects hook
const { data: teamProjects } = useTeamProjects(id)

// Show project list in right column:
// Each: project name + status badge + start date + manager name
// Clicking → /projects/:id
// Empty: "No projects assigned to this team"
// Loading: 3 skeleton rows
```

---

## ACCEPTANCE CRITERIA — Phase 5 is complete when:

Backend:
- [ ] GET /api/projects returns paginated list with manager, lead, team, members
- [ ] GET /api/projects?search= filters by project name
- [ ] GET /api/projects?status=active filters by status
- [ ] GET /api/projects?tech=React filters by tech stack
- [ ] GET /api/projects/:id returns full detail with all relations
- [ ] GET /api/projects/recent returns 5 most recent projects
- [ ] GET /api/projects/user/:userId returns user's project memberships
- [ ] GET /api/projects/team/:teamId returns team's projects
- [ ] POST /api/projects creates new project
- [ ] PUT /api/projects/:id updates project fields
- [ ] DELETE /api/projects/:id (admin only) deletes project
- [ ] POST /api/projects/:id/members adds member with role
- [ ] DELETE /api/projects/:id/members/:userId removes member
- [ ] Seed: 4 projects created with members assigned

Frontend — Projects list:
- [ ] /projects shows table with all 4 seeded projects
- [ ] Status dot + badge renders correctly per status
- [ ] Tech stack chips show with correct colors
- [ ] Search filter works in real time
- [ ] Status dropdown filter works
- [ ] Tech chip filter toggles work
- [ ] Pagination works
- [ ] Clicking project name navigates to detail page
- [ ] 3-dot menu shows View/Edit/Delete options
- [ ] "+ Add Project" opens modal with all form fields

Frontend — Project detail:
- [ ] /projects/:id loads with all tabs visible
- [ ] Overview tab shows mission, tech stack, core team, project info sidebar
- [ ] Manager and Tech Lead names are clickable → /employees/:id
- [ ] Team chip is clickable → /teams/:id
- [ ] Team tab shows full member list
- [ ] Add/remove member works on Team tab
- [ ] Tasks/Notes/Activity tabs show "coming soon" placeholder
- [ ] Edit button opens pre-filled form modal

Cross-module:
- [ ] Employee profile shows real assigned projects
- [ ] Team detail shows real assigned projects
- [ ] Dashboard "Total Projects" stat card shows real count
- [ ] Dashboard "Recent Projects" section shows real project rows

Code quality:
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
