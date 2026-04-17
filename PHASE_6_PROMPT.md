# OrgSphere — Phase 6 Prompt
# My Workspace: Tasks + Notes + My Dashboard
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phases 1–5 are complete: auth, app shell, employees, teams, and projects all working.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod, nuqs
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token + httpOnly refresh cookie
- Rich text editor: Tiptap v2 (for My Notes page)
- Shared Zod schemas: /packages/schemas/

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full auth, employee, team, project modules
- All shared UI components
- App shell with sidebar and header
- Stub pages at /my/dashboard, /my/tasks, /my/notes
- Project detail page has Tasks + Notes tabs showing "coming in Phase 6"
- types/index.ts has User, Project, Team types

---

## TASK — Phase 6: My Workspace

Build the complete personal workspace for each logged-in user:
1. Backend: Task entity + CRUD API (personal tasks)
2. Backend: Note entity + CRUD API (personal notes with Tiptap JSON)
3. Frontend: My Tasks page (list view + kanban view)
4. Frontend: My Notes page (split-pane editor with Tiptap)
5. Frontend: My Dashboard page (personal overview)
6. Wire Tasks tab on Project detail page
7. Wire Notes tab on Project detail page
8. Update dashboard stats: My Open Tasks count

---

## STEP 1 — Shared Zod schemas

### packages/schemas/task.schema.ts
```typescript
import { z } from 'zod'

export const taskStatusEnum = z.enum(['todo', 'in_progress', 'review', 'done'])
export const taskPriorityEnum = z.enum(['low', 'medium', 'high'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  status: taskStatusEnum.default('todo'),
  priority: taskPriorityEnum.default('medium'),
  due_date: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  due_date: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export const taskQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  project_id: z.string().uuid().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQuery = z.infer<typeof taskQuerySchema>
export type TaskStatus = z.infer<typeof taskStatusEnum>
export type TaskPriority = z.infer<typeof taskPriorityEnum>
```

### packages/schemas/note.schema.ts
```typescript
import { z } from 'zod'

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  project_id: z.string().uuid().optional().nullable(),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export const noteQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  tag: z.string().optional(),
  project_id: z.string().uuid().optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteQuery = z.infer<typeof noteQuerySchema>
```

Update packages/schemas/index.ts to export from task.schema.ts and note.schema.ts.

---

## STEP 2 — Backend: Task entity

### server/src/entities/Task.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './User'
import { Project } from './Project'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({
    type: 'enum',
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
  })
  status!: TaskStatus

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority!: TaskPriority

  @Column({ type: 'date', nullable: true })
  due_date!: string | null

  @Column({ type: 'uuid' })
  assigned_to!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_to' })
  assignee!: User

  @Column({ type: 'uuid', nullable: true })
  project_id!: string | null

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null

  @Column({ type: 'uuid' })
  created_by!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

---

## STEP 3 — Backend: Note entity

### server/src/entities/Note.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './User'
import { Project } from './Project'

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, unknown>

  @Column({ type: 'jsonb', default: [] })
  tags!: string[]

  @Column({ type: 'uuid' })
  user_id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'uuid', nullable: true })
  project_id!: string | null

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

---

## STEP 4 — Backend: Update data source

Add Task and Note to entities:
```typescript
import { Task } from './entities/Task'
import { Note } from './entities/Note'

entities: [User, Team, Project, ProjectMember, Task, Note],
```

Generate and run migration:
```bash
cd server
npm run migration:generate -- -n CreateTasksAndNotesTable
npm run migration:run
```

---

## STEP 5 — Backend: Task service

### server/src/services/task.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { Task } from '../entities/Task'
import { CreateTaskInput, UpdateTaskInput, TaskQuery } from '@orgsphere/schemas'

const repo = () => AppDataSource.getRepository(Task)

export const findByUser = async (userId: string, query: TaskQuery) => {
  const { page, limit, status, priority, project_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('task')
    .leftJoin('task.project', 'project')
    .select([
      'task.id', 'task.title', 'task.description',
      'task.status', 'task.priority', 'task.due_date',
      'task.assigned_to', 'task.project_id',
      'task.created_at', 'task.updated_at',
      'project.id', 'project.name',
    ])
    .where('task.assigned_to = :userId', { userId })
    .orderBy('task.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (status) qb = qb.andWhere('task.status = :status', { status })
  if (priority) qb = qb.andWhere('task.priority = :priority', { priority })
  if (project_id) qb = qb.andWhere('task.project_id = :project_id', { project_id })

  const [tasks, total] = await qb.getManyAndCount()

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string, userId: string) => {
  return repo()
    .createQueryBuilder('task')
    .leftJoinAndSelect('task.project', 'project')
    .where('task.id = :id AND task.assigned_to = :userId', { id, userId })
    .getOne()
}

export const create = async (input: CreateTaskInput, userId: string) => {
  const task = repo().create({
    ...input,
    assigned_to: userId,
    created_by: userId,
  })
  return repo().save(task)
}

export const update = async (id: string, userId: string, input: UpdateTaskInput) => {
  const task = await repo().findOne({
    where: { id, assigned_to: userId },
  })
  if (!task) throw new Error('NOT_FOUND')
  Object.assign(task, input)
  return repo().save(task)
}

export const remove = async (id: string, userId: string) => {
  const task = await repo().findOne({
    where: { id, assigned_to: userId },
  })
  if (!task) throw new Error('NOT_FOUND')
  await repo().remove(task)
}

export const countOpenByUser = async (userId: string) => {
  return repo().count({
    where: [
      { assigned_to: userId, status: 'todo' },
      { assigned_to: userId, status: 'in_progress' },
      { assigned_to: userId, status: 'review' },
    ],
  })
}

export const getTodayByUser = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0]
  return repo()
    .createQueryBuilder('task')
    .leftJoin('task.project', 'project')
    .select([
      'task.id', 'task.title', 'task.status',
      'task.priority', 'task.due_date',
      'project.id', 'project.name',
    ])
    .where('task.assigned_to = :userId', { userId })
    .andWhere(
      '(task.due_date = :today OR task.status IN (:...activeStatuses))',
      { today, activeStatuses: ['in_progress', 'review'] }
    )
    .orderBy('task.priority', 'DESC')
    .take(10)
    .getMany()
}
```

---

## STEP 6 — Backend: Task controller

### server/src/controllers/task.controller.ts
```typescript
import { Request, Response } from 'express'
import * as TaskService from '../services/task.service'
import { taskQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'

export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = taskQuerySchema.parse(req.query)
    const result = await TaskService.findByUser(req.user!.id, query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' })
  }
}

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.findById(req.params.id, req.user!.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.json(task)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.create(req.body, req.user!.id)
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' })
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await TaskService.update(req.params.id, req.user!.id, req.body)
    res.json(task)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update task' })
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await TaskService.remove(req.params.id, req.user!.id)
    res.json({ message: 'Task deleted' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Task not found' })
      return
    }
    res.status(500).json({ message: 'Failed to delete task' })
  }
}
```

### server/src/routes/task.routes.ts
```typescript
import { Router } from 'express'
import { getMyTasks, getOne, create, update, remove } from '../controllers/task.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createTaskSchema, updateTaskSchema } from '@orgsphere/schemas'

const router = Router()
router.use(authMiddleware)

router.get('/', getMyTasks)
router.get('/:id', getOne)
router.post('/', validate(createTaskSchema), create)
router.put('/:id', validate(updateTaskSchema), update)
router.delete('/:id', remove)

export default router
```

Register in app.ts:
```typescript
import taskRoutes from './routes/task.routes'
app.use('/api/tasks', taskRoutes)
```

---

## STEP 7 — Backend: Note service + controller + routes

### server/src/services/note.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { Note } from '../entities/Note'
import { ILike } from 'typeorm'
import { CreateNoteInput, UpdateNoteInput, NoteQuery } from '@orgsphere/schemas'

const repo = () => AppDataSource.getRepository(Note)

export const findByUser = async (userId: string, query: NoteQuery) => {
  const { page, limit, search, tag, project_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('note')
    .leftJoin('note.project', 'project')
    .select([
      'note.id', 'note.title', 'note.tags',
      'note.project_id', 'note.created_at', 'note.updated_at',
      'project.id', 'project.name',
    ])
    .where('note.user_id = :userId', { userId })
    .orderBy('note.updated_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (search) {
    qb = qb.andWhere('note.title ILIKE :search', { search: `%${search}%` })
  }
  if (tag) {
    qb = qb.andWhere("note.tags::text ILIKE :tag", { tag: `%${tag}%` })
  }
  if (project_id) {
    qb = qb.andWhere('note.project_id = :project_id', { project_id })
  }

  const [notes, total] = await qb.getManyAndCount()

  return {
    data: notes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string, userId: string) => {
  return repo()
    .createQueryBuilder('note')
    .leftJoinAndSelect('note.project', 'project')
    .where('note.id = :id AND note.user_id = :userId', { id, userId })
    .getOne()
}

export const create = async (input: CreateNoteInput, userId: string) => {
  const note = repo().create({ ...input, user_id: userId })
  return repo().save(note)
}

export const update = async (id: string, userId: string, input: UpdateNoteInput) => {
  const note = await repo().findOne({ where: { id, user_id: userId } })
  if (!note) throw new Error('NOT_FOUND')
  Object.assign(note, input)
  return repo().save(note)
}

export const remove = async (id: string, userId: string) => {
  const note = await repo().findOne({ where: { id, user_id: userId } })
  if (!note) throw new Error('NOT_FOUND')
  await repo().remove(note)
}

export const countByUser = async (userId: string) => {
  return repo().count({ where: { user_id: userId } })
}

export const getRecentByUser = async (userId: string, limit = 3) => {
  return repo()
    .createQueryBuilder('note')
    .select(['note.id', 'note.title', 'note.tags', 'note.updated_at'])
    .where('note.user_id = :userId', { userId })
    .orderBy('note.updated_at', 'DESC')
    .take(limit)
    .getMany()
}
```

### server/src/controllers/note.controller.ts
```typescript
import { Request, Response } from 'express'
import * as NoteService from '../services/note.service'
import { noteQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'

export const getMyNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = noteQuerySchema.parse(req.query)
    const result = await NoteService.findByUser(req.user!.id, query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes' })
  }
}

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.findById(req.params.id, req.user!.id)
    if (!note) {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    res.json(note)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch note' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.create(req.body, req.user!.id)
    res.status(201).json(note)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note' })
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.update(req.params.id, req.user!.id, req.body)
    res.json(note)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update note' })
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await NoteService.remove(req.params.id, req.user!.id)
    res.json({ message: 'Note deleted' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    res.status(500).json({ message: 'Failed to delete note' })
  }
}
```

### server/src/routes/note.routes.ts
```typescript
import { Router } from 'express'
import { getMyNotes, getOne, create, update, remove } from '../controllers/note.controller'
import { authMiddleware } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createNoteSchema, updateNoteSchema } from '@orgsphere/schemas'

const router = Router()
router.use(authMiddleware)

router.get('/', getMyNotes)
router.get('/:id', getOne)
router.post('/', validate(createNoteSchema), create)
router.put('/:id', validate(updateNoteSchema), update)
router.delete('/:id', remove)

export default router
```

Register in app.ts:
```typescript
import noteRoutes from './routes/note.routes'
app.use('/api/notes', noteRoutes)
```

---

## STEP 8 — Backend: Update dashboard stats

### Update server/src/controllers/dashboard.controller.ts
```typescript
import { Task } from '../entities/Task'
import { Note } from '../entities/Note'
import * as TaskService from '../services/task.service'

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo    = AppDataSource.getRepository(User)
    const teamRepo    = AppDataSource.getRepository(Team)
    const projectRepo = AppDataSource.getRepository(Project)

    const [totalEmployees, activeTeams, totalProjects, myOpenTasks] = await Promise.all([
      userRepo.count({ where: { is_active: true } }),
      teamRepo.count(),
      projectRepo.count(),
      TaskService.countOpenByUser(req.user!.id),
    ])

    res.json({ totalProjects, totalEmployees, activeTeams, myOpenTasks })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
```

---

## STEP 9 — Frontend: Install Tiptap

```bash
cd client
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder @tiptap/extension-character-count
npm install @tiptap/extension-code-block-lowlight lowlight
npm install @tiptap/extension-link @tiptap/extension-underline
```

---

## STEP 10 — Frontend: Update types

### Add to client/types/index.ts
```typescript
export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  assigned_to: string
  project_id: string | null
  project: { id: string; name: string } | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: Record<string, unknown>
  tags: string[]
  user_id: string
  project_id: string | null
  project: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
```

---

## STEP 11 — Frontend: Tasks and Notes API hooks

### client/hooks/useTasks.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Task, PaginatedResponse } from '@/types'

export interface TaskFilters {
  page?: number
  limit?: number
  status?: string
  priority?: string
  project_id?: string
}

export const useTasks = (filters: TaskFilters = {}) => {
  return useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/tasks?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

export const useCreateTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post('/tasks', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export const useUpdateTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/tasks/${id}`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export const useDeleteTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
```

### client/hooks/useNotes.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Note, PaginatedResponse } from '@/types'

export interface NoteFilters {
  page?: number
  limit?: number
  search?: string
  tag?: string
  project_id?: string
}

export const useNotes = (filters: NoteFilters = {}) => {
  return useQuery<PaginatedResponse<Note>>({
    queryKey: ['notes', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/notes?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

export const useNote = (id: string) => {
  return useQuery<Note>({
    queryKey: ['note', id],
    queryFn: async () => {
      const { data } = await api.get(`/notes/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreateNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post('/notes', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export const useUpdateNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/notes/${id}`, input)
      return data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['note', vars.id] })
    },
  })
}

export const useDeleteNote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
```

---

## STEP 12 — Frontend: My Tasks page

### app/(app)/my/tasks/page.tsx

Replace stub with full My Tasks page matching Stitch design.

```
Page layout:
- PageHeader:
    title="My Active Tasks"
    actions:
      - List/Kanban view toggle (two icon buttons, nuqs: ?view=list|kanban)
      - "+ Add Task" button (opens TaskFormModal)

STATUS FILTER BAR (below header):
  Pill tabs: All Tasks | To-Do | In Progress | Review | Completed
  nuqs: ?status=
  Right side: Filters button (opens filter panel) + priority legend dots

LIST VIEW (default, ?view=list):

Filter/sort bar:
  [Search tasks...] [Priority ▾] [Project ▾]

Table columns:
  [ ] | TASK TITLE | PROJECT | STATUS | PRIORITY | DUE DATE | ACTIONS

Row details:
  Checkbox:
    - Clicking checkbox updates status to 'done' immediately (optimistic)
    - Done tasks: strikethrough title, grayed out row

  Task title:
    - 14px/500
    - Clicking opens TaskFormModal in edit mode
    - Done: line-through + gray

  Project:
    - Project name chip (gray bg, 12px)
    - Clickable → /projects/:id
    - "—" if no project

  Status badge: StatusBadge component
    todo=gray, in_progress=amber, review=blue, done=green

  Priority dot:
    - 8px circle: high=red, medium=amber, low=gray
    - Label: "High" / "Medium" / "Low"

  Due date:
    - Format: "Oct 24" or "Today" or "Yesterday"
    - Overdue (past due, not done): red text + red bg pill
    - Due today: amber text + amber bg pill
    - Future: gray text

  Actions: 3-dot menu → Edit / Delete (with ConfirmDialog)

Row styles:
  - Height 48px
  - Hover bg-gray-50
  - Done rows: opacity-60

KANBAN VIEW (?view=kanban):

4 columns: TO-DO | IN PROGRESS | REVIEW | DONE
Each column:
  Header: Column name + count badge (indigo pill)
  Cards (white, rounded-lg, border, shadow-sm, p-3):
    - Category label (small colored chip, derived from project name)
    - Task title (14px/500, 2 lines max)
    - Due date (12px, gray or red if overdue)
    - Priority dot (8px circle, right side)
    - Assignee avatar (24px, bottom right)
  Column: max-height calc(100vh - 200px), overflow-y scroll
  "+ Add task" button at bottom of each column
    Clicking pre-fills status for that column

TASK FORM MODAL (TaskFormModal.tsx):
  Title: "Add Task" or "Edit Task"
  Fields (React Hook Form + createTaskSchema):
    Title (required, full width)
    Description (textarea, 3 rows, optional)
    Row: Status (select) | Priority (select)
    Row: Due Date (date input) | Project (select from user's projects)
  Submit: "Add Task" / "Save Changes"
  On success: close + toast + invalidate tasks query

EMPTY STATE:
  - CheckSquare icon + "No tasks yet"
  - "+ Create your first task" button
  - For filtered empty: "No tasks match your filters"

LOADING STATE:
  - List: 5 skeleton rows
  - Kanban: 2 skeleton cards per column
```

---

## STEP 13 — Frontend: Tiptap editor component

### components/notes/TiptapEditor.tsx
```typescript
// Props:
//   content: Record<string, unknown>  (Tiptap JSON)
//   onChange: (content: Record<string, unknown>) => void
//   editable?: boolean (default true)
//   placeholder?: string

// Toolbar buttons (above editor):
//   Bold (B) | Italic (I) | Underline (U) | Heading (T)
//   | Bullet list | Numbered list | Code block | Link

// Toolbar design:
//   White bg, bottom border gray-100
//   Each button: 32px square, rounded-md
//   Active state: bg-indigo-50 text-indigo-600
//   Hover: bg-gray-100

// Editor area:
//   min-height: 400px
//   Font: Inter 15px, line-height 1.7
//   Prose styling: headings, lists, code blocks styled cleanly
//   Placeholder text when empty (gray-400)
//   Code blocks: dark bg (gray-900), monospace, rounded-lg

// Extensions to include:
//   StarterKit (includes bold, italic, headings, lists, code)
//   Placeholder
//   Underline
//   Link (with href prompt on click)
//   CodeBlockLowlight (syntax highlighting)

// Auto-save indicator:
//   Show "Saving..." then "Saved at HH:MM" in top-right
//   Debounce onChange by 1000ms before triggering save
```

---

## STEP 14 — Frontend: My Notes page

### app/(app)/my/notes/page.tsx

Replace stub with full My Notes page matching Stitch design exactly.

```
LAYOUT: Two-panel (fixed height: h-[calc(100vh-64px)])

LEFT PANEL (280px, fixed, white, right border gray-100):

  Header:
    "Notes" title (16px/600)
    [≡] sort/filter icon button (right)

  "+ New Note" button:
    Dashed border, full width, indigo text
    Clicking: creates new blank note immediately via API
    Navigates to new note (sets selectedNoteId)

  Search input:
    "Filter notes..." placeholder
    nuqs: ?search= — filters note list

  Note list (scrollable):
    Each note item:
      Title (13px/500, 1 line, truncate)
      Date (11px, gray, relative: "2m ago", "1h ago", "Yesterday")
      First tag chip (12px, colored pill)
      Active note: indigo left border (2px) + indigo-50 bg
      Hover: bg-gray-50
      Right-click or hover: show delete icon (×)
      Clicking: sets selectedNoteId

  Empty state (no notes):
    FileText icon + "No notes yet" + "+ Create your first note"

  Empty state (search no results):
    "No notes match '{search}'"

RIGHT PANEL (flex-1, bg-white):

  WHEN NO NOTE SELECTED:
    Centered EmptyState:
      FileText icon (48px, gray-300)
      "Select a note or create a new one"
      "+ New Note" button

  WHEN NOTE SELECTED (useNote(selectedNoteId)):

    Top bar:
      Left:  Note title (editable input, 20px/600, no border, full width)
             On blur/enter: save title via API
      Right: "Saved at HH:MM" indicator (gray, 12px)
             Share icon button
             3-dot menu → Delete note (ConfirmDialog)

    Meta bar (below title, border-bottom gray-100):
      Tags input:
        Shows existing tags as indigo chips with × remove
        Type + Enter to add new tag
        Tags saved on change via API (debounced 800ms)
      Linked Project dropdown:
        Shows project name if linked
        Dropdown to change/unlink project
        Updates note.project_id via API

    Editor area:
      TiptapEditor component
      content={note.content}
      onChange={handleContentChange}  (debounced 1000ms → PUT /api/notes/:id)
      placeholder="Start writing..."

    Auto-save behavior:
      Title changes: save on blur
      Content changes: debounced 1000ms auto-save
      Tags changes: debounced 800ms auto-save
      Save indicator: "Saving..." → "Saved at HH:MM" → fades after 3s

LOADING STATE (note selected but loading):
  Skeleton for title bar + skeleton lines for content

URL state:
  nuqs: ?note= (selectedNoteId)
  Loading page with ?note=uuid opens that note directly
  Allows shareable note links
```

---

## STEP 15 — Frontend: My Dashboard page

### app/(app)/my/dashboard/page.tsx

Replace stub with full personal dashboard matching Stitch design.

```typescript
'use client'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { RootState } from '@/store'
import { useTasks } from '@/hooks/useTasks'
import { useNotes } from '@/hooks/useNotes'
import { useUserProjects } from '@/hooks/useProjects'
import api from '@/lib/axios'

// Page sections:

// 1. GREETING HEADER
//    "Good morning/afternoon/evening, {firstName}"  (24px/600)
//    "{weekday}, {month} {day}, {year}"  (14px, gray)
//    Right: "Your productivity is up X% this week" badge (indigo bg, white text)
//           → hardcoded/placeholder stat for now

// 2. PERSONAL STAT CARDS (3 columns)
//    Card 1 — MY TASKS
//      Large number: total tasks count
//      Subtitle: "{open} Active"
//      Progress bar: done / total (indigo fill)
//      Icon: CheckSquare (indigo)
//    Card 2 — MY PROJECTS
//      Large number: project count
//      Subtitle: "{N} added since last month" → hardcoded
//      Icon: FolderKanban (teal)
//    Card 3 — MY NOTES
//      Large number: total notes count
//      Subtitle: "Quick capture active"
//      Icon: FileText (purple)

// 3. TWO COLUMN LAYOUT (60/40):

//    LEFT — "My Tasks (Today)" card:
//      Header: "My Tasks (Today)" + "Focused workflow for {date}" subtitle + ... menu
//      Task checklist (up to 6 items from getTodayByUser):
//        Each row:
//          Circle checkbox (clicking → mark done via API)
//          Task title (strikethrough if done)
//          Project name (12px, gray)
//          Due time or priority badge
//          Done tasks: grayed + line-through
//      "View all tasks →" link at bottom → /my/tasks
//      Empty: "No tasks for today — enjoy your day! 🎉"

//    RIGHT — "My Notes (Recent)" card:
//      Header: "My Notes" + "(Recent)" gray subtitle + "View All →" link
//      3 most recent notes (from getRecentByUser):
//        Each note card (white, border, rounded-lg, p-3, mb-2):
//          Tag chip (top, colored by tag)
//          Timestamp (12px, gray, right)
//          Title (14px/500)
//          Preview: first 80 chars of content (plain text extracted from Tiptap JSON)
//          Active note: indigo left border
//        Clicking → /my/notes?note={id}
//      Empty: "No notes yet" + "+ Create note" → /my/notes

// 4. ACTIVE PROJECTS (below two columns):
//    Header: "Active Projects" + grid/list toggle
//    useUserProjects(user.id) — shows projects where user is a member
//    Grid: 3 columns of project cards:
//      Project name + status badge + team name + role on project
//      Clicking → /projects/:id
//    Empty: "You haven't been assigned to any projects yet"
//    Loading: 3 skeleton cards
```

---

## STEP 16 — Frontend: Wire project detail Tasks tab

### Update app/(app)/projects/[id]/page.tsx — Tasks tab

Replace the "coming in Phase 6" placeholder on the Tasks tab:

```typescript
// Tasks tab content:
// Filter bar: All | Todo | In Progress | Review | Done
// Task list filtered by project_id:
//   const { data: tasks } = useTasks({ project_id: id, status: filter })
//   Each row: checkbox + title + assignee avatar + status + due date
//   Only show tasks assigned to current user OR all tasks if admin/manager
// "+ Add Task" button → opens TaskFormModal with project_id pre-filled
// Empty: EmptyState with CheckSquare icon
```

---

## STEP 17 — Frontend: Wire project detail Notes tab

### Update app/(app)/projects/[id]/page.tsx — Notes tab

Replace the "coming in Phase 6" placeholder on the Notes tab:

```typescript
// Notes tab content:
// Simple list of notes linked to this project:
//   const { data: notes } = useNotes({ project_id: id })
//   Each row: note title + tags + author avatar + last updated date
//   Clicking → /my/notes?note={id}
// "+ Add Note" button → creates new note with project_id pre-filled → /my/notes?note={newId}
// Only shows current user's notes linked to this project
// Empty: EmptyState with FileText icon
```

---

## STEP 18 — Frontend: Seed tasks and notes for development

### server/src/seeds/tasks-notes.seed.ts
```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Task } from '../entities/Task'
import { Note } from '../entities/Note'
import { User } from '../entities/User'
import { Project } from '../entities/Project'

async function seed() {
  await AppDataSource.initialize()

  const userRepo    = AppDataSource.getRepository(User)
  const projectRepo = AppDataSource.getRepository(Project)
  const taskRepo    = AppDataSource.getRepository(Task)
  const noteRepo    = AppDataSource.getRepository(Note)

  const sumit   = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const alpha   = await projectRepo.findOne({ where: { name: 'Alpha Platform' } })
  const beta    = await projectRepo.findOne({ where: { name: 'Beta Analytics Dashboard' } })

  if (!sumit) { console.log('❌ Sumit not found'); return }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const tasksData = [
    { title: 'Review architectural specifications', status: 'todo' as const, priority: 'high' as const, due_date: today, project_id: alpha?.id },
    { title: 'Draft Q4 resource allocation', status: 'todo' as const, priority: 'medium' as const, due_date: today, project_id: null },
    { title: 'Stand-up meeting with design team', status: 'done' as const, priority: 'medium' as const, due_date: yesterday, project_id: null },
    { title: 'Update security protocols on AWS', status: 'in_progress' as const, priority: 'high' as const, due_date: tomorrow, project_id: alpha?.id },
    { title: 'Finalize API documentation', status: 'review' as const, priority: 'medium' as const, due_date: tomorrow, project_id: alpha?.id },
    { title: 'Setup analytics pipeline', status: 'in_progress' as const, priority: 'high' as const, due_date: today, project_id: beta?.id },
    { title: 'Write unit tests for auth module', status: 'todo' as const, priority: 'low' as const, due_date: null, project_id: alpha?.id },
    { title: 'Create onboarding documentation', status: 'todo' as const, priority: 'medium' as const, due_date: null, project_id: null },
  ]

  for (const t of tasksData) {
    const task = taskRepo.create({
      ...t,
      assigned_to: sumit.id,
      created_by: sumit.id,
    })
    await taskRepo.save(task)
  }
  console.log(`✅ Created ${tasksData.length} tasks for Sumit`)

  const notesData = [
    {
      title: 'Q4 Product Roadmap',
      tags: ['Strategy', 'Urgent'],
      project_id: alpha?.id,
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'The primary goal for Q4 is to complete the platform migration and launch the analytics dashboard. Key milestones include API v2 release, mobile app beta, and design system rollout.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Strategic Pillars' }] },
          { type: 'bulletList', content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete microservices migration' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Launch analytics dashboard v1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Onboard 3 new enterprise clients' }] }] },
          ]},
        ],
      },
    },
    {
      title: 'Weekly Sync Notes',
      tags: ['Team'],
      project_id: null,
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Action items from engineering team regarding new dashboard latency issues. Need to investigate PostgreSQL query performance and consider adding Redis caching layer.' }] },
        ],
      },
    },
    {
      title: 'Architecture Decision: Microservices',
      tags: ['Technical', 'Draft'],
      project_id: alpha?.id,
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Documenting the decision to migrate from monolith to microservices. Main drivers: team scalability, independent deployments, and technology flexibility.' }] },
        ],
      },
    },
  ]

  for (const n of notesData) {
    const note = noteRepo.create({ ...n, user_id: sumit.id })
    await noteRepo.save(note)
  }
  console.log(`✅ Created ${notesData.length} notes for Sumit`)

  console.log('🌱 Tasks and notes seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add to server/package.json:
```json
"seed:workspace": "ts-node src/seeds/tasks-notes.seed.ts"
```

Run: `npm run seed:workspace`

---

## ACCEPTANCE CRITERIA — Phase 6 is complete when:

Backend:
- [ ] GET /api/tasks returns current user's tasks (paginated)
- [ ] GET /api/tasks?status=todo filters correctly
- [ ] POST /api/tasks creates task assigned to current user
- [ ] PUT /api/tasks/:id updates task (owner only)
- [ ] DELETE /api/tasks/:id deletes task (owner only)
- [ ] GET /api/notes returns current user's notes (paginated)
- [ ] GET /api/notes?search= filters by title
- [ ] GET /api/notes/:id returns note with full content
- [ ] POST /api/notes creates note with Tiptap JSON content
- [ ] PUT /api/notes/:id updates note content/title/tags
- [ ] DELETE /api/notes/:id deletes note (owner only)
- [ ] Dashboard stats myOpenTasks returns real count
- [ ] Seed: 8 tasks + 3 notes created for Sumit

Frontend — My Tasks:
- [ ] /my/tasks shows list view with all seeded tasks
- [ ] Kanban view shows tasks in correct columns
- [ ] Switching between list/kanban view works
- [ ] Status filter tabs filter tasks correctly
- [ ] Checkbox click marks task as done (optimistic update)
- [ ] Done tasks show strikethrough + grayed
- [ ] Overdue tasks show red due date
- [ ] "+ Add Task" modal creates task with all fields
- [ ] Edit task modal pre-fills and saves correctly
- [ ] Delete task with ConfirmDialog works

Frontend — My Notes:
- [ ] /my/notes shows split-pane layout
- [ ] Notes list shows all 3 seeded notes
- [ ] Clicking a note opens it in the editor (right panel)
- [ ] Tiptap editor renders note content correctly
- [ ] Typing in editor auto-saves after 1 second (debounced)
- [ ] "Saving..." → "Saved at HH:MM" indicator works
- [ ] Title is editable inline (saves on blur)
- [ ] Tags can be added (Enter) and removed (×)
- [ ] "+ New Note" creates blank note and opens it
- [ ] Delete note removes from list
- [ ] Search filters notes list
- [ ] ?note= URL param opens correct note directly

Frontend — My Dashboard:
- [ ] /my/dashboard shows personalized greeting with first name
- [ ] 3 stat cards show real task count, project count, note count
- [ ] "Today's Tasks" section shows tasks due today or in progress
- [ ] Checking a task in today's list updates it immediately
- [ ] "Recent Notes" shows last 3 notes with previews
- [ ] "Active Projects" section shows user's assigned projects
- [ ] All links navigate correctly

Project detail:
- [ ] Tasks tab on project detail shows tasks for that project
- [ ] Notes tab on project detail shows notes linked to project
- [ ] "Add Task" on Tasks tab pre-fills project_id

Dashboard:
- [ ] "My Open Tasks" stat card shows real count

Code quality:
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
- [ ] Tiptap editor has no hydration errors (use 'use client' correctly)
