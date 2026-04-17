# OrgSphere — Phase 7 Prompt
# Activity Feed + Live Dashboard + Notification Bell
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phases 1–6 are complete: auth, app shell, employees, teams, projects, my workspace.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod, nuqs
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token + httpOnly refresh cookie
- Shared Zod schemas: /packages/schemas/

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full auth, employee, team, project, task, note modules
- All shared UI components
- App shell with sidebar and header
- Project detail Activity tab showing "coming in Phase 7" placeholder
- Dashboard with real stat counts but placeholder activity feed
- ActivityLog entity does NOT exist yet — build it in this phase

---

## TASK — Phase 7: Activity Feed + Live Dashboard + Notification Bell

Build the complete activity logging system and wire it across the entire app:
1. Backend: ActivityLog entity + migration
2. Backend: Activity logging middleware — auto-logs all write operations
3. Backend: Activity feed API endpoints (global + per-entity + my activity)
4. Frontend: Global activity feed component (used on dashboard)
5. Frontend: Wire Activity tab on Project detail page
6. Frontend: Notification bell with unread count + dropdown
7. Frontend: Wire activity feed on My Dashboard
8. Auto-poll activity feed every 30 seconds (no WebSockets needed)

---

## STEP 1 — Backend: ActivityLog entity

### server/src/entities/ActivityLog.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './User'

export type ActivityAction =
  | 'created' | 'updated' | 'deleted'
  | 'member_added' | 'member_removed'
  | 'status_changed' | 'assigned' | 'completed'
  | 'uploaded' | 'commented'

export type ActivityEntityType =
  | 'project' | 'employee' | 'team'
  | 'task' | 'note' | 'project_member' | 'team_member'

@Entity('activity_logs')
@Index(['entity_type', 'entity_id'])
@Index(['actor_id'])
@Index(['created_at'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  action!: ActivityAction

  @Column({ type: 'varchar', length: 100 })
  entity_type!: ActivityEntityType

  @Column({ type: 'uuid' })
  entity_id!: string

  // Human-readable entity name at time of action (for display)
  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_name!: string | null

  @Column({ type: 'uuid', nullable: true })
  actor_id!: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor!: User | null

  // Extra context: e.g. { old_status: 'active', new_status: 'completed' }
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  // Whether actor has "seen" this (for notification bell)
  // Stored as array of user IDs who have read it
  @Column({ type: 'jsonb', default: [] })
  read_by!: string[]

  @CreateDateColumn()
  created_at!: Date
}
```

### Update server/src/data-source.ts
```typescript
import { ActivityLog } from './entities/ActivityLog'

entities: [User, Team, Project, ProjectMember, Task, Note, ActivityLog],
```

Generate and run migration:
```bash
cd server
npm run migration:generate -- -n CreateActivityLogsTable
npm run migration:run
```

---

## STEP 2 — Backend: Activity service

### server/src/services/activity.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { ActivityLog, ActivityAction, ActivityEntityType } from '../entities/ActivityLog'

const repo = () => AppDataSource.getRepository(ActivityLog)

export interface LogActivityInput {
  action: ActivityAction
  entity_type: ActivityEntityType
  entity_id: string
  entity_name?: string
  actor_id?: string
  metadata?: Record<string, unknown>
}

// Core logging function — called after every write operation
export const log = async (input: LogActivityInput): Promise<void> => {
  try {
    const entry = repo().create({
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_name: input.entity_name ?? null,
      actor_id: input.actor_id ?? null,
      metadata: input.metadata ?? {},
      read_by: [],
    })
    await repo().save(entry)
  } catch (error) {
    // Never throw from activity logging — it must not break main operations
    console.error('Activity log error:', error)
  }
}

export interface ActivityQuery {
  page?: number
  limit?: number
  entity_type?: ActivityEntityType
  entity_id?: string
  actor_id?: string
}

// Global feed — most recent activities across entire system
export const getGlobalFeed = async (query: ActivityQuery = {}) => {
  const { page = 1, limit = 20, entity_type, entity_id, actor_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id', 'log.action', 'log.entity_type', 'log.entity_id',
      'log.entity_name', 'log.metadata', 'log.read_by', 'log.created_at',
      'actor.id', 'actor.name', 'actor.avatar_path', 'actor.role',
    ])
    .orderBy('log.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (entity_type) qb = qb.where('log.entity_type = :entity_type', { entity_type })
  if (entity_id) qb = qb.andWhere('log.entity_id = :entity_id', { entity_id })
  if (actor_id) qb = qb.andWhere('log.actor_id = :actor_id', { actor_id })

  const [logs, total] = await qb.getManyAndCount()

  return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// Activity for a specific entity (e.g. all activity on Project Alpha)
export const getEntityActivity = async (
  entity_type: ActivityEntityType,
  entity_id: string,
  limit = 20
) => {
  return repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id', 'log.action', 'log.entity_type', 'log.entity_id',
      'log.entity_name', 'log.metadata', 'log.created_at',
      'actor.id', 'actor.name', 'actor.avatar_path',
    ])
    .where('log.entity_id = :entity_id', { entity_id })
    .andWhere('log.entity_type = :entity_type', { entity_type })
    .orderBy('log.created_at', 'DESC')
    .take(limit)
    .getMany()
}

// Unread notifications for a specific user
export const getUnreadCount = async (userId: string): Promise<number> => {
  const count = await repo()
    .createQueryBuilder('log')
    .where('NOT (:userId = ANY(log.read_by))', { userId })
    .andWhere('log.actor_id != :userId', { userId }) // Don't notify user of own actions
    .andWhere("log.created_at > NOW() - INTERVAL '7 days'")
    .getCount()
  return count
}

// Mark activities as read for a user
export const markAllRead = async (userId: string): Promise<void> => {
  const unread = await repo()
    .createQueryBuilder('log')
    .where('NOT (:userId = ANY(log.read_by))', { userId })
    .andWhere('log.actor_id != :userId', { userId })
    .getMany()

  for (const log of unread) {
    if (!log.read_by.includes(userId)) {
      log.read_by = [...log.read_by, userId]
    }
  }

  if (unread.length > 0) {
    await repo().save(unread)
  }
}

// Get recent activities (for dashboard — last 10)
export const getRecentGlobal = async (limit = 10) => {
  return repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id', 'log.action', 'log.entity_type', 'log.entity_id',
      'log.entity_name', 'log.metadata', 'log.created_at',
      'actor.id', 'actor.name', 'actor.avatar_path',
    ])
    .orderBy('log.created_at', 'DESC')
    .take(limit)
    .getMany()
}
```

---

## STEP 3 — Backend: Activity message formatter

### server/src/utils/activity.formatter.ts

This utility generates human-readable messages from activity log entries.
Used by the frontend to display feed items.

```typescript
import { ActivityLog } from '../entities/ActivityLog'

export interface FormattedActivity {
  id: string
  actor_name: string
  actor_avatar: string | null
  actor_id: string | null
  message: string           // e.g. "updated Project Alpha"
  entity_type: string
  entity_id: string
  entity_name: string | null
  action: string
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal'
  created_at: string
  time_ago: string          // relative time: "2m ago", "1h ago", "2d ago"
}

const actionColors: Record<string, FormattedActivity['color']> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
  member_added: 'teal',
  member_removed: 'amber',
  status_changed: 'purple',
  assigned: 'blue',
  completed: 'green',
  uploaded: 'teal',
  commented: 'blue',
}

const entityLabels: Record<string, string> = {
  project: 'project',
  employee: 'employee',
  team: 'team',
  task: 'task',
  note: 'note',
  project_member: 'project',
  team_member: 'team',
}

const actionMessages: Record<string, (entityName: string, metadata: Record<string, unknown>) => string> = {
  created:        (name) => `created ${name}`,
  updated:        (name) => `updated ${name}`,
  deleted:        (name) => `deleted ${name}`,
  member_added:   (name, meta) => `added ${meta.member_name ?? 'a member'} to ${name}`,
  member_removed: (name, meta) => `removed ${meta.member_name ?? 'a member'} from ${name}`,
  status_changed: (name, meta) => `changed status of ${name} to ${meta.new_status ?? 'unknown'}`,
  assigned:       (name, meta) => `assigned ${name} to ${meta.assignee_name ?? 'someone'}`,
  completed:      (name) => `completed ${name}`,
  uploaded:       (name) => `uploaded a file to ${name}`,
  commented:      (name) => `commented on ${name}`,
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const format = (log: ActivityLog): FormattedActivity => {
  const entityLabel = entityLabels[log.entity_type] ?? log.entity_type
  const entityName = log.entity_name
    ? `${entityLabel} "${log.entity_name}"`
    : entityLabel

  const messageFn = actionMessages[log.action]
  const message = messageFn
    ? messageFn(entityName, log.metadata)
    : `${log.action} ${entityName}`

  return {
    id: log.id,
    actor_name: log.actor?.name ?? 'System',
    actor_avatar: log.actor?.avatar_path ?? null,
    actor_id: log.actor_id,
    message,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    entity_name: log.entity_name,
    action: log.action,
    color: actionColors[log.action] ?? 'blue',
    created_at: log.created_at.toISOString(),
    time_ago: timeAgo(new Date(log.created_at)),
  }
}

export const formatMany = (logs: ActivityLog[]): FormattedActivity[] => {
  return logs.map(format)
}
```

---

## STEP 4 — Backend: Activity controller + routes

### server/src/controllers/activity.controller.ts
```typescript
import { Request, Response } from 'express'
import * as ActivityService from '../services/activity.service'
import { formatMany } from '../utils/activity.formatter'
import { AuthRequest } from '../middleware/auth'

export const getGlobalFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const result = await ActivityService.getGlobalFeed({ page, limit })
    res.json({
      ...result,
      data: formatMany(result.data),
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity feed' })
  }
}

export const getEntityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_type, entity_id } = req.params
    const limit = parseInt(req.query.limit as string) || 20
    const logs = await ActivityService.getEntityActivity(
      entity_type as any,
      entity_id,
      limit
    )
    res.json(formatMany(logs))
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch entity activity' })
  }
}

export const getRecentFeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await ActivityService.getRecentGlobal(10)
    res.json(formatMany(logs))
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recent activity' })
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await ActivityService.getUnreadCount(req.user!.id)
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch unread count' })
  }
}

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ActivityService.markAllRead(req.user!.id)
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read' })
  }
}
```

### server/src/routes/activity.routes.ts
```typescript
import { Router } from 'express'
import {
  getGlobalFeed, getEntityFeed, getRecentFeed,
  getUnreadCount, markAllRead
} from '../controllers/activity.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// IMPORTANT: specific routes before param routes
router.get('/recent', getRecentFeed)
router.get('/unread-count', getUnreadCount)
router.post('/mark-read', markAllRead)
router.get('/:entity_type/:entity_id', getEntityFeed)
router.get('/', getGlobalFeed)

export default router
```

Register in server/src/app.ts:
```typescript
import activityRoutes from './routes/activity.routes'
app.use('/api/activity', activityRoutes)
```

---

## STEP 5 — Backend: Wire activity logging into all existing services

This is the most important step. After every create/update/delete operation
in each service, call ActivityService.log(). Do NOT await in controllers —
fire and forget to avoid slowing down responses.

### Update server/src/services/employee.service.ts

Add activity logging to create, update, remove:
```typescript
import * as ActivityService from './activity.service'

// In create():
await ActivityService.log({
  action: 'created',
  entity_type: 'employee',
  entity_id: savedUser.id,
  entity_name: savedUser.name,
  actor_id: actorId,  // pass actorId as parameter to create()
})

// In update():
await ActivityService.log({
  action: 'updated',
  entity_type: 'employee',
  entity_id: id,
  entity_name: user.name,
  actor_id: actorId,
})

// In remove():
await ActivityService.log({
  action: 'deleted',
  entity_type: 'employee',
  entity_id: id,
  entity_name: user.name,
  actor_id: actorId,
})
```

Update employee.controller.ts to pass req.user!.id as actorId to service functions.

### Update server/src/services/team.service.ts

Add activity logging to create, update, remove, addMember, removeMember:
```typescript
// In create():
await ActivityService.log({
  action: 'created',
  entity_type: 'team',
  entity_id: saved.id,
  entity_name: saved.name,
  actor_id: creatorId,
})

// In addMember():
await ActivityService.log({
  action: 'member_added',
  entity_type: 'team_member',
  entity_id: teamId,
  entity_name: team.name,
  actor_id: actorId,
  metadata: { member_name: user.name, member_id: userId },
})

// In removeMember():
await ActivityService.log({
  action: 'member_removed',
  entity_type: 'team_member',
  entity_id: teamId,
  entity_name: team.name,
  actor_id: actorId,
  metadata: { member_name: removedUser.name, member_id: userId },
})
```

Update team.controller.ts to pass req.user!.id to all service calls.

### Update server/src/services/project.service.ts

Add activity logging to create, update, remove, addMember, removeMember:
```typescript
// In create():
await ActivityService.log({
  action: 'created',
  entity_type: 'project',
  entity_id: saved.id,
  entity_name: saved.name,
  actor_id: actorId,
})

// In update():
// Check if status changed — log status_changed specifically
if (input.status && input.status !== project.status) {
  await ActivityService.log({
    action: 'status_changed',
    entity_type: 'project',
    entity_id: id,
    entity_name: project.name,
    actor_id: actorId,
    metadata: { old_status: project.status, new_status: input.status },
  })
} else {
  await ActivityService.log({
    action: 'updated',
    entity_type: 'project',
    entity_id: id,
    entity_name: project.name,
    actor_id: actorId,
  })
}

// In addMember():
await ActivityService.log({
  action: 'member_added',
  entity_type: 'project_member',
  entity_id: projectId,
  entity_name: project.name,
  actor_id: actorId,
  metadata: { member_name: member.name, member_id: input.user_id, role: input.role },
})
```

### Update server/src/services/task.service.ts

Add activity logging to create, update (status changes), remove:
```typescript
// In create():
await ActivityService.log({
  action: 'created',
  entity_type: 'task',
  entity_id: saved.id,
  entity_name: saved.title,
  actor_id: userId,
})

// In update():
if (input.status === 'done' && task.status !== 'done') {
  await ActivityService.log({
    action: 'completed',
    entity_type: 'task',
    entity_id: id,
    entity_name: task.title,
    actor_id: userId,
  })
} else if (input.status && input.status !== task.status) {
  await ActivityService.log({
    action: 'status_changed',
    entity_type: 'task',
    entity_id: id,
    entity_name: task.title,
    actor_id: userId,
    metadata: { old_status: task.status, new_status: input.status },
  })
}
```

### Update server/src/services/note.service.ts

Add activity logging to create and remove only (not update — too noisy):
```typescript
// In create():
await ActivityService.log({
  action: 'created',
  entity_type: 'note',
  entity_id: saved.id,
  entity_name: saved.title,
  actor_id: userId,
})
```

---

## STEP 6 — Backend: Seed activity logs

### server/src/seeds/activity.seed.ts

Create realistic activity logs so the feed is populated:

```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { ActivityLog } from '../entities/ActivityLog'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'

async function seed() {
  await AppDataSource.initialize()

  const logRepo     = AppDataSource.getRepository(ActivityLog)
  const userRepo    = AppDataSource.getRepository(User)
  const projectRepo = AppDataSource.getRepository(Project)
  const teamRepo    = AppDataSource.getRepository(Team)

  const sumit   = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const raj     = await userRepo.findOne({ where: { email: 'raj@orgsphere.io' } })
  const priya   = await userRepo.findOne({ where: { email: 'priya@orgsphere.io' } })
  const ananya  = await userRepo.findOne({ where: { email: 'ananya@orgsphere.io' } })
  const alpha   = await projectRepo.findOne({ where: { name: 'Alpha Platform' } })
  const beta    = await projectRepo.findOne({ where: { name: 'Beta Analytics Dashboard' } })
  const platform = await teamRepo.findOne({ where: { name: 'Platform Team' } })

  if (!sumit || !alpha) {
    console.log('❌ Required seed data missing. Run employee + project seeds first.')
    return
  }

  const now = Date.now()
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000

  const entries = [
    {
      action: 'updated', entity_type: 'project', entity_id: alpha.id,
      entity_name: alpha.name, actor_id: raj?.id,
      metadata: {}, created_at: new Date(now - 14 * minute),
    },
    {
      action: 'status_changed', entity_type: 'project', entity_id: beta?.id,
      entity_name: beta?.name, actor_id: priya?.id,
      metadata: { old_status: 'planned', new_status: 'active' },
      created_at: new Date(now - 1 * hour),
    },
    {
      action: 'member_added', entity_type: 'team_member', entity_id: platform?.id,
      entity_name: platform?.name, actor_id: sumit?.id,
      metadata: { member_name: ananya?.name, member_id: ananya?.id },
      created_at: new Date(now - 3 * hour),
    },
    {
      action: 'completed', entity_type: 'task', entity_id: sumit.id,
      entity_name: 'Stand-up meeting with design team', actor_id: sumit.id,
      metadata: {}, created_at: new Date(now - 5 * hour),
    },
    {
      action: 'created', entity_type: 'note', entity_id: sumit.id,
      entity_name: 'Q4 Product Roadmap', actor_id: sumit.id,
      metadata: {}, created_at: new Date(now - 1 * day),
    },
    {
      action: 'created', entity_type: 'employee', entity_id: ananya?.id ?? sumit.id,
      entity_name: ananya?.name ?? 'New Employee', actor_id: sumit.id,
      metadata: {}, created_at: new Date(now - 2 * day),
    },
    {
      action: 'updated', entity_type: 'project', entity_id: alpha.id,
      entity_name: alpha.name, actor_id: raj?.id,
      metadata: { field: 'tech_stack' }, created_at: new Date(now - 2 * day),
    },
    {
      action: 'created', entity_type: 'project', entity_id: beta?.id ?? alpha.id,
      entity_name: beta?.name ?? 'New Project', actor_id: priya?.id ?? sumit.id,
      metadata: {}, created_at: new Date(now - 3 * day),
    },
  ]

  for (const entry of entries) {
    const log = logRepo.create({
      ...entry,
      read_by: [],
    } as any)
    await logRepo.save(log)
  }

  console.log(`✅ Created ${entries.length} activity log entries`)
  console.log('🌱 Activity seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add to server/package.json:
```json
"seed:activity": "ts-node src/seeds/activity.seed.ts"
```

Run: `npm run seed:activity`

---

## STEP 7 — Frontend: Types + Activity hook

### Add to client/types/index.ts
```typescript
export type ActivityColor = 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal'

export interface ActivityItem {
  id: string
  actor_name: string
  actor_avatar: string | null
  actor_id: string | null
  message: string
  entity_type: string
  entity_id: string
  entity_name: string | null
  action: string
  color: ActivityColor
  created_at: string
  time_ago: string
}

export interface ActivityFeed {
  data: ActivityItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

### client/hooks/useActivity.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { ActivityFeed, ActivityItem } from '@/types'

// Global activity feed — paginated
export const useActivityFeed = (page = 1, limit = 20) => {
  return useQuery<ActivityFeed>({
    queryKey: ['activity-feed', page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/activity?page=${page}&limit=${limit}`)
      return data
    },
    // Auto-refetch every 30 seconds — simulates real-time
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

// Recent feed for dashboard (10 items, no pagination)
export const useRecentActivity = () => {
  return useQuery<ActivityItem[]>({
    queryKey: ['activity-recent'],
    queryFn: async () => {
      const { data } = await api.get('/activity/recent')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

// Activity for a specific entity (project, team, etc.)
export const useEntityActivity = (entityType: string, entityId: string) => {
  return useQuery<ActivityItem[]>({
    queryKey: ['activity-entity', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get(`/activity/${entityType}/${entityId}`)
      return data
    },
    enabled: !!entityType && !!entityId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

// Unread notification count
export const useUnreadCount = () => {
  return useQuery<{ count: number }>({
    queryKey: ['activity-unread'],
    queryFn: async () => {
      const { data } = await api.get('/activity/unread-count')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

// Mark all as read
export const useMarkAllRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post('/activity/mark-read')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-unread'] })
      qc.invalidateQueries({ queryKey: ['activity-feed'] })
      qc.invalidateQueries({ queryKey: ['activity-recent'] })
    },
  })
}
```

---

## STEP 8 — Frontend: ActivityFeedItem component

### components/activity/ActivityFeedItem.tsx
```typescript
// Props: item: ActivityItem, compact?: boolean

// Design (compact=false — dashboard):
// ┌────────────────────────────────────────────────────┐
// │ [●] [Avatar 32px]  Actor name (13px/500)           │
// │      message text (13px, gray)   •  2h ago (11px)  │
// └────────────────────────────────────────────────────┘

// Color dot (8px circle, left):
//   green = created / completed
//   blue = updated / assigned
//   red = deleted
//   purple = status_changed
//   amber = member_removed
//   teal = member_added / uploaded

// Avatar: Avatar component (size='sm', 32px)
// If no actor: show gray "system" icon

// Entity name in message: render as a clickable link
//   project → /projects/:entity_id
//   employee → /employees/:entity_id
//   team → /teams/:entity_id
//   task / note → do not link (personal items)
//   team_member / project_member → link to the entity_id (team or project)

// Compact=true (project activity tab — no avatar, smaller):
// [●] Actor name  message  •  2m ago

// Hover: bg-gray-50 on full row
// Padding: py-3 px-0 (no horizontal padding — parent provides it)
// Divider: border-bottom gray-50 (not gray-100 — very subtle)
```

---

## STEP 9 — Frontend: ActivityFeed component

### components/activity/ActivityFeed.tsx
```typescript
// Props:
//   items: ActivityItem[]
//   isLoading: boolean
//   title?: string  (default "Activity Feed")
//   showHeader?: boolean (default true)
//   compact?: boolean (default false)
//   maxHeight?: string (default 'none')

// Design:
// Header row: title (16px/600) + filter icon button (right)
//   Filter options (dropdown): All / Projects / Teams / Employees / Tasks
//   Clicking filter: re-queries with entity_type filter

// Feed list:
//   Each item: ActivityFeedItem component
//   Infinite scroll OR "Load more" button at bottom

// Loading state:
//   5 skeleton rows:
//     Circle (8px) + Avatar skeleton (32px) + two lines of gray pulses

// Empty state:
//   Activity icon + "No activity yet" + "Actions will appear here as your team works"

// Auto-refresh indicator:
//   Small "● Live" green dot + "Updates every 30s" (11px, gray)
//   Bottom of feed

// "Load more" button:
//   Shows when there are more pages
//   Loads next page, appends to list (not replaces)
//   Loading spinner on button while fetching
```

---

## STEP 10 — Frontend: Update main Dashboard activity feed

### Update app/(app)/dashboard/page.tsx

Replace the placeholder activity feed skeleton with the real ActivityFeed component:

```typescript
// Replace right column placeholder with:
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useRecentActivity } from '@/hooks/useActivity'

const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity()

// In JSX — right column (1/3 width):
<ActivityFeed
  items={recentActivity}
  isLoading={activityLoading}
  title="Activity Feed"
  maxHeight="480px"
/>
```

---

## STEP 11 — Frontend: Wire Activity tab on Project detail

### Update app/(app)/projects/[id]/page.tsx — Activity tab

Replace the "coming in Phase 7" placeholder:

```typescript
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { useEntityActivity } from '@/hooks/useActivity'

// Activity tab content:
const { data: projectActivity = [], isLoading: activityLoading } =
  useEntityActivity('project', id)

// Render:
<ActivityFeed
  items={projectActivity}
  isLoading={activityLoading}
  title={`${project.name} Activity`}
  compact={true}
  showHeader={false}
/>
```

---

## STEP 12 — Frontend: Notification bell with dropdown

### Update components/layout/Header.tsx

Replace the static bell icon with a working notification bell:

```typescript
import { useUnreadCount, useActivityFeed, useMarkAllRead } from '@/hooks/useActivity'
import { ActivityFeedItem } from '@/components/activity/ActivityFeedItem'

// In Header component:
const { data: unreadData } = useUnreadCount()
const unreadCount = unreadData?.count ?? 0
const [bellOpen, setBellOpen] = useState(false)
const { data: recentFeed } = useActivityFeed(1, 8)
const { mutate: markRead } = useMarkAllRead()

// Bell button with badge:
<div style="position: relative; display: inline-block">
  <button
    onClick={() => {
      setBellOpen(!bellOpen)
      if (!bellOpen && unreadCount > 0) markRead()
    }}
    className="p-2 rounded-lg hover:bg-gray-100 relative"
  >
    <BellIcon size={20} className="text-gray-500" />
    {unreadCount > 0 && (
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
    )}
  </button>

  // Dropdown panel (when bellOpen=true):
  // Position: absolute, right-0, top-12
  // Width: 360px
  // White bg, rounded-xl, shadow-lg, border gray-100
  // Max-height: 480px, overflow-y auto

  // Panel header:
  //   "Notifications" (15px/600) left
  //   Unread count badge (indigo pill) center
  //   "Mark all read" text button right

  // Feed list:
  //   ActivityFeedItem for each of last 8 activities (compact=true)

  // Footer:
  //   "View all activity" link → would go to a dedicated page (future)

  // Click outside to close: useEffect with mousedown listener
</div>
```

---

## STEP 13 — Frontend: Update My Dashboard activity

### Update app/(app)/my/dashboard/page.tsx

Add a small activity section at the bottom showing the user's own recent activity:

```typescript
import { useActivityFeed } from '@/hooks/useActivity'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

// My recent activity (filtered by current user as actor)
// Use: GET /api/activity?actor_id={userId}&limit=5
// For now use useRecentActivity and filter client-side to actor matches

// Add after the Active Projects section:
// Section: "Recent Activity" (small, below active projects)
//   Title: "My Recent Activity" (14px/600)
//   Last 5 activity items where actor = current user
//   Compact mode ActivityFeed
//   "—" if no activity yet
```

---

## STEP 14 — Frontend: ActivityFeed shared styles

### Add to app/globals.css

```css
/* Activity feed color dots */
.activity-dot-green  { background-color: #22C55E; }
.activity-dot-blue   { background-color: #3B82F6; }
.activity-dot-red    { background-color: #EF4444; }
.activity-dot-purple { background-color: #8B5CF6; }
.activity-dot-amber  { background-color: #F59E0B; }
.activity-dot-teal   { background-color: #14B8A6; }
```

---

## STEP 15 — Backend: Update dashboard endpoint to include recent activity

### Update server/src/controllers/dashboard.controller.ts

Add recent activity to the dashboard response:

```typescript
import { getRecentGlobal } from '../services/activity.service'
import { formatMany } from '../utils/activity.formatter'

// Add to getStats():
const recentActivity = await getRecentGlobal(8)

res.json({
  totalProjects,
  totalEmployees,
  activeTeams,
  myOpenTasks,
  recentActivity: formatMany(recentActivity),
})
```

Update the frontend dashboard to also accept recentActivity from the stats endpoint
as a fallback (the dedicated `/api/activity/recent` endpoint is preferred).

---

## ACCEPTANCE CRITERIA — Phase 7 is complete when:

Backend:
- [ ] GET /api/activity returns paginated global feed with formatted items
- [ ] GET /api/activity/recent returns last 10 formatted activity items
- [ ] GET /api/activity/:entity_type/:entity_id returns entity-specific feed
- [ ] GET /api/activity/unread-count returns correct count for current user
- [ ] POST /api/activity/mark-read marks all as read for current user
- [ ] Creating a project logs a 'created' activity entry
- [ ] Updating a project logs an 'updated' or 'status_changed' entry
- [ ] Adding a team member logs a 'member_added' entry
- [ ] Completing a task logs a 'completed' entry
- [ ] Seed: 8 realistic activity log entries visible in DB

Frontend — Activity feed component:
- [ ] ActivityFeedItem renders color dot, avatar, message, time correctly
- [ ] Entity names in messages are clickable links to correct pages
- [ ] ActivityFeed shows loading skeleton while fetching
- [ ] ActivityFeed shows empty state when no items
- [ ] "Live" indicator shows at bottom of feed
- [ ] Feed auto-refetches every 30 seconds (verify in Network tab)

Frontend — Dashboard:
- [ ] Activity feed on main dashboard shows real recent activities
- [ ] Activities refresh automatically without page reload

Frontend — Project detail:
- [ ] Activity tab on /projects/:id shows project-specific activity
- [ ] Activities are filtered correctly to that project only
- [ ] Performing an action (e.g. editing project) adds a new entry to the tab

Frontend — Notification bell:
- [ ] Bell icon shows red dot badge when unread count > 0
- [ ] Clicking bell opens dropdown with last 8 activities
- [ ] Opening bell marks all as read (badge disappears)
- [ ] Dropdown closes when clicking outside
- [ ] Unread count re-fetches every 30 seconds

Frontend — My Dashboard:
- [ ] My Recent Activity section shows user's own recent actions

Code quality:
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
- [ ] Activity logging never breaks main operations (errors caught silently)
