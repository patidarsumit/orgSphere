# OrgSphere — Phase 4 Prompt
# Teams Module (Backend + Frontend)
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phases 1 (auth), 2 (app shell), and 3 (employee module) are complete and working.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod, nuqs
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token + httpOnly refresh cookie — already working
- Shared Zod schemas: /packages/schemas/

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full auth system + User entity
- Employee module (full CRUD, directory page, profile page, avatar upload)
- All shared UI components (StatCard, PageHeader, StatusBadge, Avatar, AvatarStack, EmptyState, LoadingSpinner, ConfirmDialog)
- App shell (Sidebar, Header, protected layout)
- Stub pages at /teams and /teams/[id]
- Seed data: 10 employees in PostgreSQL with manager relationships
- Types at client/types/index.ts

---

## TASK — Phase 4: Teams Module

Build the complete teams feature end to end:
1. Backend: Team + TeamMember entities and migration
2. Backend: Teams CRUD API with member management
3. Frontend: Teams directory page (card grid)
4. Frontend: Team detail page with member management
5. Frontend: Create/Edit team modal
6. Update employee profile page to show team memberships
7. Update dashboard stats to include real team count
8. Seed: create 4 sample teams with members

---

## STEP 1 — Shared Zod schemas

### packages/schemas/team.schema.ts
```typescript
import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(255),
  description: z.string().max(1000).optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
})

export const addTeamMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
})

export const teamQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  search: z.string().optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>
export type TeamQuery = z.infer<typeof teamQuerySchema>
```

Update packages/schemas/index.ts to export from team.schema.ts.

---

## STEP 2 — Backend: Team and TeamMember entities

### server/src/entities/Team.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from 'typeorm'
import { User } from './User'

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({ type: 'uuid', nullable: true })
  created_by!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: User | null

  @ManyToMany(() => User, (user) => user.teams)
  @JoinTable({
    name: 'team_members',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members!: User[]

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

### Update server/src/entities/User.ts

Add the teams relationship to the User entity:
```typescript
// Add this import at top
import { Team } from './Team'

// Add this property inside the User class
@ManyToMany(() => Team, (team) => team.members)
teams!: Team[]
```

### Update server/src/data-source.ts

Add Team to the entities array:
```typescript
import { Team } from './entities/Team'

// In DataSource config:
entities: [User, Team],
```

---

## STEP 3 — Backend: TypeORM migration

Generate and run migration for teams and team_members tables:

```bash
cd server
npm run migration:generate -- -n CreateTeamsTable
npm run migration:run
```

The migration should create:
```sql
-- teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- team_members join table
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);
```

---

## STEP 4 — Backend: Team service

### server/src/services/team.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { Team } from '../entities/Team'
import { User } from '../entities/User'
import { ILike } from 'typeorm'
import { CreateTeamInput, UpdateTeamInput, TeamQuery } from '@orgsphere/schemas'

const repo = () => AppDataSource.getRepository(Team)
const userRepo = () => AppDataSource.getRepository(User)

export const findAll = async (query: TeamQuery) => {
  const { page, limit, search } = query
  const skip = (page - 1) * limit

  const qb = repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .select([
      'team.id', 'team.name', 'team.description',
      'team.created_by', 'team.created_at',
      'member.id', 'member.name', 'member.avatar_path', 'member.role',
    ])
    .skip(skip)
    .take(limit)
    .orderBy('team.created_at', 'DESC')

  if (search) {
    qb.where('team.name ILIKE :search', { search: `%${search}%` })
  }

  const [teams, total] = await qb.getManyAndCount()

  return {
    data: teams,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .leftJoinAndSelect('team.creator', 'creator')
    .select([
      'team.id', 'team.name', 'team.description',
      'team.created_by', 'team.created_at', 'team.updated_at',
      'member.id', 'member.name', 'member.email',
      'member.avatar_path', 'member.role', 'member.department',
      'creator.id', 'creator.name', 'creator.avatar_path',
    ])
    .where('team.id = :id', { id })
    .getOne()
}

export const create = async (input: CreateTeamInput, creatorId: string) => {
  const team = repo().create({
    ...input,
    created_by: creatorId,
  })
  const saved = await repo().save(team)

  // Creator is automatically a member
  const creator = await userRepo().findOne({ where: { id: creatorId } })
  if (creator) {
    saved.members = [creator]
    await repo().save(saved)
  }

  return saved
}

export const update = async (id: string, input: UpdateTeamInput) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')
  Object.assign(team, input)
  return repo().save(team)
}

export const remove = async (id: string) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')
  await repo().remove(team)
}

export const addMember = async (teamId: string, userId: string) => {
  const team = await repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .where('team.id = :id', { id: teamId })
    .getOne()

  if (!team) throw new Error('TEAM_NOT_FOUND')

  const user = await userRepo().findOne({ where: { id: userId, is_active: true } })
  if (!user) throw new Error('USER_NOT_FOUND')

  const alreadyMember = team.members.some((m) => m.id === userId)
  if (alreadyMember) throw new Error('ALREADY_MEMBER')

  team.members = [...team.members, user]
  return repo().save(team)
}

export const removeMember = async (teamId: string, userId: string) => {
  const team = await repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .where('team.id = :id', { id: teamId })
    .getOne()

  if (!team) throw new Error('TEAM_NOT_FOUND')

  team.members = team.members.filter((m) => m.id !== userId)
  return repo().save(team)
}

export const getTeamsByUserId = async (userId: string) => {
  return repo()
    .createQueryBuilder('team')
    .innerJoin('team.members', 'member', 'member.id = :userId', { userId })
    .leftJoinAndSelect('team.members', 'allMembers')
    .select([
      'team.id', 'team.name', 'team.description', 'team.created_at',
      'allMembers.id', 'allMembers.name', 'allMembers.avatar_path',
    ])
    .getMany()
}
```

---

## STEP 5 — Backend: Team controller

### server/src/controllers/team.controller.ts
```typescript
import { Request, Response } from 'express'
import * as TeamService from '../services/team.service'
import { teamQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = teamQuerySchema.parse(req.query)
    const result = await TeamService.findAll(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams' })
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.findById(req.params.id)
    if (!team) {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    res.json(team)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const team = await TeamService.create(req.body, req.user!.id)
    res.status(201).json(team)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create team' })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.update(req.params.id, req.body)
    res.json(team)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update team' })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await TeamService.remove(req.params.id)
    res.json({ message: 'Team deleted successfully' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    res.status(500).json({ message: 'Failed to delete team' })
  }
}

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.addMember(req.params.id, req.body.user_id)
    res.json(team)
  } catch (error: any) {
    const msg: Record<string, number> = {
      TEAM_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      ALREADY_MEMBER: 409,
    }
    const status = msg[error.message] || 500
    res.status(status).json({ message: error.message })
  }
}

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    await TeamService.removeMember(req.params.id, req.params.userId)
    res.json({ message: 'Member removed successfully' })
  } catch (error: any) {
    if (error.message === 'TEAM_NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    res.status(500).json({ message: 'Failed to remove member' })
  }
}

export const getByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await TeamService.getTeamsByUserId(req.params.userId)
    res.json(teams)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user teams' })
  }
}
```

---

## STEP 6 — Backend: Team routes

### server/src/routes/team.routes.ts
```typescript
import { Router } from 'express'
import {
  getAll, getOne, create, update, remove, addMember, removeMember, getByUser
} from '../controllers/team.controller'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createTeamSchema, updateTeamSchema, addTeamMemberSchema } from '@orgsphere/schemas'

const router = Router()

router.use(authMiddleware)

router.get('/', getAll)
router.get('/user/:userId', getByUser)
router.get('/:id', getOne)
router.post('/', validate(createTeamSchema), create)
router.put('/:id', validate(updateTeamSchema), update)
router.delete('/:id', adminOnly, remove)
router.post('/:id/members', validate(addTeamMemberSchema), addMember)
router.delete('/:id/members/:userId', removeMember)

export default router
```

Register in server/src/app.ts:
```typescript
import teamRoutes from './routes/team.routes'
app.use('/api/teams', teamRoutes)
```

Update dashboard stats controller to include real team count:
```typescript
// In dashboard.controller.ts
import { Team } from '../entities/Team'

const teamRepo = AppDataSource.getRepository(Team)
const activeTeams = await teamRepo.count()

res.json({
  totalProjects: 0,    // Phase 5
  totalEmployees,
  activeTeams,
  myOpenTasks: 0,      // Phase 6
})
```

---

## STEP 7 — Backend: Seed teams

### server/src/seeds/teams.seed.ts
```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Team } from '../entities/Team'
import { User } from '../entities/User'

async function seed() {
  await AppDataSource.initialize()

  const userRepo = AppDataSource.getRepository(User)
  const teamRepo = AppDataSource.getRepository(Team)

  // Fetch seeded employees
  const sumit  = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const raj    = await userRepo.findOne({ where: { email: 'raj@orgsphere.io' } })
  const priya  = await userRepo.findOne({ where: { email: 'priya@orgsphere.io' } })
  const ananya = await userRepo.findOne({ where: { email: 'ananya@orgsphere.io' } })
  const vikram = await userRepo.findOne({ where: { email: 'vikram@orgsphere.io' } })
  const neha   = await userRepo.findOne({ where: { email: 'neha@orgsphere.io' } })
  const amit   = await userRepo.findOne({ where: { email: 'amit@orgsphere.io' } })
  const rahul  = await userRepo.findOne({ where: { email: 'rahul@orgsphere.io' } })
  const deepa  = await userRepo.findOne({ where: { email: 'deepa@orgsphere.io' } })
  const kavita = await userRepo.findOne({ where: { email: 'kavita@orgsphere.io' } })

  const teamsData = [
    {
      name: 'Platform Team',
      description: 'Core infrastructure and backend platform development',
      created_by: sumit?.id,
      members: [sumit, raj, vikram, neha, rahul].filter(Boolean) as User[],
    },
    {
      name: 'Product Team',
      description: 'Product strategy, design and user experience',
      created_by: priya?.id,
      members: [priya, ananya, kavita].filter(Boolean) as User[],
    },
    {
      name: 'Mobile Team',
      description: 'iOS and Android mobile application development',
      created_by: amit?.id,
      members: [amit, neha, vikram].filter(Boolean) as User[],
    },
    {
      name: 'Growth Team',
      description: 'Marketing, analytics and business growth initiatives',
      created_by: priya?.id,
      members: [priya, deepa].filter(Boolean) as User[],
    },
  ]

  for (const t of teamsData) {
    const exists = await teamRepo.findOne({ where: { name: t.name } })
    if (!exists) {
      const team = teamRepo.create({
        name: t.name,
        description: t.description,
        created_by: t.created_by ?? null,
        members: t.members,
      })
      await teamRepo.save(team)
      console.log(`✅ Created team: ${t.name} with ${t.members.length} members`)
    } else {
      console.log(`⏭️  Skipped (exists): ${t.name}`)
    }
  }

  console.log('🌱 Teams seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add to server/package.json scripts:
```json
"seed:teams": "ts-node src/seeds/teams.seed.ts"
```

Run: `npm run seed:teams`

---

## STEP 8 — Frontend: Update types

### Add to client/types/index.ts
```typescript
export interface Team {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  members: User[]
  creator?: User | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_path: string | null
  department: string | null
}
```

---

## STEP 9 — Frontend: Teams API hooks

### client/hooks/useTeams.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Team, PaginatedResponse } from '@/types'

export interface TeamFilters {
  page?: number
  limit?: number
  search?: string
}

export const useTeams = (filters: TeamFilters = {}) => {
  return useQuery<PaginatedResponse<Team>>({
    queryKey: ['teams', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/teams?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

export const useTeam = (id: string) => {
  return useQuery<Team>({
    queryKey: ['team', id],
    queryFn: async () => {
      const { data } = await api.get(`/teams/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useUserTeams = (userId: string) => {
  return useQuery<Team[]>({
    queryKey: ['user-teams', userId],
    queryFn: async () => {
      const { data } = await api.get(`/teams/user/${userId}`)
      return data
    },
    enabled: !!userId,
  })
}

export const useCreateTeam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await api.post('/teams', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export const useUpdateTeam = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name?: string; description?: string | null }) => {
      const { data } = await api.put(`/teams/${id}`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team', id] })
    },
  })
}

export const useAddTeamMember = (teamId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/teams/${teamId}/members`, { user_id: userId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', teamId] })
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export const useRemoveTeamMember = (teamId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/teams/${teamId}/members/${userId}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', teamId] })
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export const useDeleteTeam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/teams/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
```

---

## STEP 10 — Frontend: Teams directory page

### app/(app)/teams/page.tsx

Replace the stub with the full teams directory matching the Stitch design.

```
Page layout:
- PageHeader:
    title="Teams"
    subtitle="Coordinate collaboration across your organization"
    actions: "+ Create Team" button (opens CreateTeamModal)

- Search bar (nuqs: ?search=, debounced 300ms)
  Width: 320px, left-aligned

TEAM CARD GRID (3 columns, responsive: xl:3, lg:2, md:1):

Each team card:
┌─────────────────────────────┐
│ [Team icon]    ACTIVE badge │  ← icon: colored circle with first letter
│                             │
│ Team Name (16px/600)        │
│ Description (13px, gray,    │
│   2 lines max, truncate)    │
│                             │
│ [av][av][av] +N  X Members  │  ← AvatarStack + member count
│                   Y Online  │  ← hardcoded "Online" for now
│                             │
│ 📁 Z Projects               │  ← placeholder count (Phase 5)
│                             │
│ [    View Team    ]         │  ← full-width outlined button
└─────────────────────────────┘

Card design:
- white bg, rounded-xl, border gray-100
- Hover: shadow-sm, border-gray-200, transition 150ms
- Team icon: 44px circle, deterministic color based on team name
  (use same color-from-name logic as Avatar component)
  Shows first letter of team name, white text

"Build a new team" card (always last in grid):
- Dashed border (border-dashed, border-gray-300)
- Gray bg (gray-50)
- Centered: team-add icon (48px, gray-300) + "Build a new team" + description
- Clicking opens CreateTeamModal

LOADING STATE:
- 6 skeleton cards (gray animated pulse, matching card dimensions)

EMPTY STATE (when search returns nothing):
- EmptyState component with UsersRound icon
- "No teams found" + "Try a different search or create a new team"
```

---

## STEP 11 — Frontend: Team detail page

### app/(app)/teams/[id]/page.tsx

Replace stub with full team detail page.

```
Layout:
- Back button: "← Teams" (navigates to /teams)
- PageHeader:
    title={team.name}
    subtitle={team.description}
    actions:
      - "Edit Team" button (opens EditTeamModal, admin/creator only)
      - "Delete Team" button (red outlined, opens ConfirmDialog, admin only)

TWO-COLUMN layout (2/3 left + 1/3 right):

LEFT — Members section:
  Header: "Members" + member count badge + "+ Add Member" button
  
  Member list (each row):
  ┌──────────────────────────────────────────────┐
  │ [Avatar 40px] Name (14px/500)                │
  │               Role badge  •  Department      │
  │                              [Remove] button │
  └──────────────────────────────────────────────┘
  - "Remove" button: only visible on hover, red text
  - Clicking Remove: opens ConfirmDialog → calls removeMember mutation
  - Creator cannot be removed (show lock icon instead)
  - Current user cannot remove themselves

  Add Member section (below list):
  - "+ Add Member" button opens inline search dropdown
  - Dropdown: searchable list of all active employees NOT already in team
  - Shows Avatar + Name + Role per option
  - Clicking an employee adds them immediately (optimistic update)

RIGHT — Team info card:
  ┌─────────────────────────┐
  │ TEAM INFO               │
  │                         │
  │ Created by              │
  │ [Avatar] Creator name   │
  │                         │
  │ Created                 │
  │ Jan 12, 2024            │
  │                         │
  │ Members                 │
  │ 6 people                │
  │                         │
  │ Projects                │
  │ -- (Phase 5)            │
  └─────────────────────────┘

  Below team info:
  ┌─────────────────────────┐
  │ ASSIGNED PROJECTS       │
  │                         │
  │ Projects will appear    │
  │ after Phase 5 is built  │
  └─────────────────────────┘

LOADING STATE:
- Skeleton layout matching the two-column structure

404 STATE:
- If team not found: show EmptyState + "Back to Teams" button
```

---

## STEP 12 — Frontend: Create/Edit team modal

### components/teams/TeamFormModal.tsx

```
Props:
  open: boolean
  onClose: () => void
  team?: Team  (edit mode if provided)

Design: shadcn Dialog, max-width 480px

Form fields (React Hook Form + createTeamSchema / updateTeamSchema):
  Team Name (required)
    - Input, placeholder "e.g. Platform Team"
  Description (optional)
    - Textarea, 3 rows, placeholder "What does this team work on?"

Submit button:
  - Create mode: "Create Team"
  - Edit mode: "Save Changes"
  - Loading spinner while pending
  - Disabled while loading

On success:
  - Close modal
  - Show success toast: "Team created" or "Team updated"
  - Invalidate teams query
  - Navigate to new team's page (create mode only)
```

---

## STEP 13 — Frontend: Add member search component

### components/teams/AddMemberSearch.tsx

```typescript
// Props:
//   teamId: string
//   existingMemberIds: string[]
//   onMemberAdded: () => void

// UI: search input that filters employees
// Shows dropdown of matching employees not already in team
// Each option: Avatar + Name + Role
// Clicking adds member via useAddTeamMember mutation
// Keyboard accessible (arrow keys + enter)
// Closes dropdown on click outside
// Shows "No more employees to add" when all are already members
```

---

## STEP 14 — Frontend: Update employee profile page

### Update app/(app)/employees/[id]/page.tsx

Replace the "Teams placeholder" section with real team data:

```typescript
// Add useUserTeams hook
const { data: userTeams, isLoading: teamsLoading } = useUserTeams(id)

// Replace placeholder with real teams section:
// Each team shown as a chip/badge
// Chip: team color dot + team name
// Clicking chip navigates to /teams/[teamId]
// "Not a member of any teams" if empty
// Loading: 2 skeleton chips
```

---

## STEP 15 — Frontend: Update dashboard active teams count

The dashboard stat card for "Active Teams" should now show the real count.
This is already wired in Step 6 (dashboard controller update).
Verify it shows the correct number after running the teams seed.

---

## ACCEPTANCE CRITERIA — Phase 4 is complete when:

Backend:
- [ ] GET /api/teams returns paginated list with members array
- [ ] GET /api/teams/:id returns team with full member details + creator
- [ ] POST /api/teams creates team and adds creator as first member
- [ ] PUT /api/teams/:id updates team name/description
- [ ] DELETE /api/teams/:id (admin only) removes team
- [ ] POST /api/teams/:id/members adds member (409 if already member)
- [ ] DELETE /api/teams/:id/members/:userId removes member
- [ ] GET /api/teams/user/:userId returns all teams for a user
- [ ] Seed: 4 teams created with correct member assignments

Frontend — Teams directory:
- [ ] /teams shows card grid with all 4 seeded teams
- [ ] Each card shows member count, avatar stack, description
- [ ] "Build a new team" card appears last
- [ ] Search filters teams by name in real time
- [ ] "+ Create Team" button opens modal with form
- [ ] Creating a team closes modal, shows toast, navigates to new team
- [ ] Loading skeleton shows while fetching

Frontend — Team detail:
- [ ] /teams/:id shows team name, description, member list
- [ ] Each member shows avatar, name, role, department
- [ ] "Remove" button appears on hover (except for creator)
- [ ] Removing a member shows ConfirmDialog → removes on confirm
- [ ] Add member search filters employees not already in team
- [ ] Adding a member updates list immediately
- [ ] Team info card shows creator, created date, member count
- [ ] Edit team modal opens pre-filled and saves correctly
- [ ] Delete team shows ConfirmDialog → deletes and redirects to /teams

Frontend — Employee profile:
- [ ] Employee profile now shows real team chips instead of placeholder
- [ ] Clicking a team chip navigates to /teams/:id

Dashboard:
- [ ] "Active Teams" stat card shows real count (should be 4)

Code quality:
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
