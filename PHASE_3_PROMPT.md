# OrgSphere — Phase 3 Prompt
# Employee Module (Backend + Frontend)
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phases 1 (auth) and 2 (app shell + landing page) are complete and working.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token (access) + httpOnly cookie (refresh) — already working
- Shared Zod schemas: /packages/schemas/

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full auth system (register, login, refresh, logout, me)
- User entity at server/src/entities/User.ts
- All shared UI components (StatCard, PageHeader, StatusBadge, Avatar, AvatarStack, EmptyState, LoadingSpinner, ConfirmDialog)
- App shell (Sidebar, Header, protected layout)
- Stub pages at /employees and /employees/[id]
- Types at client/types/index.ts

---

## TASK — Phase 3: Employee Module

Build the complete employee feature end to end:
1. Backend: Employee CRUD API with search, filter, pagination, avatar upload
2. Frontend: Employee directory page (grid + table view)
3. Frontend: Employee profile page
4. Frontend: Add/Edit employee modal with form validation
5. Update dashboard stats to include real employee count

---

## STEP 1 — Shared Zod schemas (add to /packages/schemas)

### packages/schemas/employee.schema.ts
```typescript
import { z } from 'zod'

export const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']).default('employee'),
  department: z.string().max(255).optional(),
  skills: z.array(z.string()).default([]),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
})

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']).optional(),
  department: z.string().max(255).nullable().optional(),
  skills: z.array(z.string()).optional(),
  manager_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
})

export const employeeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  search: z.string().optional(),
  role: z.enum(['admin', 'manager', 'tech_lead', 'employee']).optional(),
  skill: z.string().optional(),
  department: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>
```

Update packages/schemas/index.ts to export from employee.schema.ts.

---

## STEP 2 — Backend: Employee service

### server/src/services/employee.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { ILike, FindOptionsWhere } from 'typeorm'
import bcrypt from 'bcryptjs'
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeQuery } from '@orgsphere/schemas'

const repo = () => AppDataSource.getRepository(User)

// Strip password_hash from response
export const sanitize = (user: User) => {
  const { password_hash, ...safe } = user as User & { password_hash: string }
  return safe
}

export const findAll = async (query: EmployeeQuery) => {
  const { page, limit, search, role, skill, department, is_active } = query
  const skip = (page - 1) * limit

  const where: FindOptionsWhere<User>[] = []

  const base: FindOptionsWhere<User> = {}
  if (role) base.role = role
  if (is_active !== undefined) base.is_active = is_active

  // Search across name and email
  if (search) {
    where.push({ ...base, name: ILike(`%${search}%`) })
    where.push({ ...base, email: ILike(`%${search}%`) })
  } else {
    where.push(base)
  }

  let qb = repo()
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.manager', 'manager')
    .select([
      'user.id', 'user.name', 'user.email', 'user.role',
      'user.department', 'user.skills', 'user.avatar_path',
      'user.manager_id', 'user.is_active', 'user.created_at',
      'manager.id', 'manager.name', 'manager.avatar_path', 'manager.role',
    ])
    .skip(skip)
    .take(limit)
    .orderBy('user.created_at', 'DESC')

  if (search) {
    qb = qb.where('(user.name ILIKE :search OR user.email ILIKE :search)', {
      search: `%${search}%`,
    })
  }

  if (role) qb = qb.andWhere('user.role = :role', { role })
  if (is_active !== undefined) qb = qb.andWhere('user.is_active = :is_active', { is_active })
  if (department) qb = qb.andWhere('user.department ILIKE :dept', { dept: `%${department}%` })

  // Filter by skill (jsonb array contains)
  if (skill) {
    qb = qb.andWhere('user.skills::text ILIKE :skill', { skill: `%${skill}%` })
  }

  const [users, total] = await qb.getManyAndCount()

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  const user = await repo()
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.manager', 'manager')
    .leftJoinAndSelect('user.direct_reports', 'reports')
    .select([
      'user.id', 'user.name', 'user.email', 'user.role',
      'user.department', 'user.skills', 'user.avatar_path',
      'user.manager_id', 'user.is_active', 'user.created_at',
      'manager.id', 'manager.name', 'manager.avatar_path', 'manager.role', 'manager.department',
      'reports.id', 'reports.name', 'reports.avatar_path', 'reports.role',
    ])
    .where('user.id = :id', { id })
    .getOne()

  return user
}

export const create = async (input: CreateEmployeeInput) => {
  const existing = await repo().findOne({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_EXISTS')

  const password_hash = await bcrypt.hash(input.password, 12)
  const user = repo().create({ ...input, password_hash })
  return repo().save(user)
}

export const update = async (id: string, input: UpdateEmployeeInput) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  Object.assign(user, input)
  return repo().save(user)
}

export const updateAvatar = async (id: string, avatarPath: string) => {
  await repo().update(id, { avatar_path: avatarPath })
}

export const remove = async (id: string) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')
  // Soft delete — set is_active = false
  user.is_active = false
  return repo().save(user)
}

export const getDirectReports = async (managerId: string) => {
  return repo().find({
    where: { manager_id: managerId, is_active: true },
    select: ['id', 'name', 'email', 'role', 'avatar_path', 'department'],
  })
}
```

---

## STEP 3 — Backend: Employee controller

### server/src/controllers/employee.controller.ts
```typescript
import { Request, Response } from 'express'
import * as EmployeeService from '../services/employee.service'
import { employeeQuerySchema } from '@orgsphere/schemas'
import path from 'path'
import fs from 'fs'
import { AuthRequest } from '../middleware/auth'

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = employeeQuerySchema.parse(req.query)
    const result = await EmployeeService.findAll(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employees' })
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.findById(req.params.id)
    if (!user) {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee' })
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.create(req.body)
    const { password_hash, ...safe } = user as typeof user & { password_hash: string }
    res.status(201).json(safe)
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS') {
      res.status(409).json({ message: 'Email already registered' })
      return
    }
    res.status(500).json({ message: 'Failed to create employee' })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.update(req.params.id, req.body)
    const { password_hash, ...safe } = user as typeof user & { password_hash: string }
    res.json(safe)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update employee' })
  }
}

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    const avatarPath = `uploads/avatars/${req.file.filename}`
    await EmployeeService.updateAvatar(req.params.id, avatarPath)
    res.json({ avatar_path: avatarPath, url: `http://localhost:4000/${avatarPath}` })
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload avatar' })
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user?.id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' })
      return
    }
    await EmployeeService.remove(req.params.id)
    res.json({ message: 'Employee deactivated successfully' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    res.status(500).json({ message: 'Failed to deactivate employee' })
  }
}
```

---

## STEP 4 — Backend: Multer middleware for avatar uploads

### server/src/middleware/upload.ts
```typescript
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

// Ensure upload directories exist
const avatarDir = path.join(__dirname, '../uploads/avatars')
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'))
  }
}

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})
```

---

## STEP 5 — Backend: Employee routes

### server/src/routes/employee.routes.ts
```typescript
import { Router } from 'express'
import {
  getAll, getOne, create, update, uploadAvatar, remove
} from '../controllers/employee.controller'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createEmployeeSchema, updateEmployeeSchema } from '@orgsphere/schemas'
import { avatarUpload } from '../middleware/upload'

const router = Router()

// All employee routes require auth
router.use(authMiddleware)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', validate(createEmployeeSchema), create)
router.put('/:id', validate(updateEmployeeSchema), update)
router.post('/:id/avatar', avatarUpload.single('avatar'), uploadAvatar)
router.delete('/:id', adminOnly, remove)

export default router
```

Register in server/src/app.ts:
```typescript
import employeeRoutes from './routes/employee.routes'
app.use('/api/employees', employeeRoutes)
```

Also update the dashboard stats controller to return real counts:
```typescript
// In dashboard.controller.ts getStats():
const totalEmployees = await userRepo.count({ where: { is_active: true } })
```

---

## STEP 6 — Frontend: Employee API hooks

### client/hooks/useEmployees.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { User, PaginatedResponse } from '@/types'

export interface EmployeeFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  skill?: string
  department?: string
}

// Fetch paginated employees
export const useEmployees = (filters: EmployeeFilters = {}) => {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/employees?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

// Fetch single employee
export const useEmployee = (id: string) => {
  return useQuery<User & {
    manager: User | null
    direct_reports: User[]
  }>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create employee
export const useCreateEmployee = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post('/employees', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

// Update employee
export const useUpdateEmployee = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.put(`/employees/${id}`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee', id] })
    },
  })
}

// Upload avatar
export const useUploadAvatar = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.post(`/employees/${id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// Deactivate employee
export const useDeactivateEmployee = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/employees/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
```

---

## STEP 7 — Frontend: Employee directory page

### app/(app)/employees/page.tsx

Replace the stub page with the full employee directory matching the Stitch design.

```
Page layout:
- PageHeader: title="Employees", subtitle="{total} members active in OrgSphere"
  Actions: "+ Add Employee" button (opens AddEmployeeModal)
- View toggle: Grid / Table (two icon buttons, state via useState)
- Filter bar:
    Search input (nuqs: ?search=) — debounced 300ms
    Role dropdown (nuqs: ?role=) — All Roles / Admin / Manager / Tech Lead / Employee
    Skills input (nuqs: ?skill=) — text search
    "Clear filters" button (only when filters active)

GRID VIEW (default):
- 4-column responsive grid (xl:4, lg:3, md:2, sm:1)
- Employee card:
    Avatar (size='lg', 56px) top-left
    Department badge top-right (small, gray)
    Name (14px/500)
    Role (13px, gray)
    Skills: up to 3 chip tags, "+N more" if extra
    "View Profile →" link (indigo, 13px) — appears on hover
    Card: white, rounded-xl, border gray-100, hover: shadow-sm transition
- Loading state: 8 skeleton cards (gray animated pulse)
- Empty state: EmptyState component with Users icon

TABLE VIEW:
- Columns: Avatar+Name | Role | Department | Skills | Actions
- Row height: 52px
- Hover: bg-gray-50
- Skills: show first 2 chips + "+N" badge
- Actions column: "View" button + 3-dot menu (Edit, Deactivate)
- Sticky header
- Loading state: 8 skeleton rows

PAGINATION:
- Bottom of page
- "Showing X–Y of Z employees"
- Previous / page numbers / Next buttons
- 12 items per page default
- Page state via nuqs: ?page=
```

---

## STEP 8 — Frontend: Employee profile page

### app/(app)/employees/[id]/page.tsx

Replace the stub with the full profile page matching Stitch design.

```
Layout:
┌─────────────────────────────────────────────┐
│  Profile banner (gray-100 bg, 120px height)  │
│  [Avatar 72px overlapping bottom edge]       │
│  Name (20px/600)  Role (14px gray)  Email   │
└─────────────────────────────────────────────┘

Three-column layout (1/3 left + 2/3 right):

LEFT COLUMN:
  1. Skills section
     - Section label "TOP SKILLS"
     - Skill chips (indigo bg + text, rounded-full)
     - "No skills added" if empty
  2. Contact info
     - Email with mail icon
     - Department with building icon
  3. Reporting To section
     - Manager card: Avatar + name + role
     - Clickable → manager's profile page
     - "No manager assigned" if null
  4. Direct Reports section
     - List of avatar + name + role
     - Each clickable → their profile
     - "No direct reports" if empty

RIGHT COLUMN:
  1. Assigned Projects section (placeholder for Phase 5)
     - "Projects will appear after Phase 5" placeholder card
  2. Teams section (placeholder for Phase 4)
     - "Teams will appear after Phase 4" placeholder card
  3. Recent Activity section
     - "Activity will appear after Phase 7" placeholder
     - Show 3 skeleton rows

HEADER ACTIONS (top right):
  - If viewing own profile OR admin: "Edit Profile" button
  - Admin only: "Deactivate Account" button (red, opens ConfirmDialog)

DATA FETCHING:
  - useEmployee(id) hook — TanStack Query
  - Loading state: skeleton layout matching the three-column structure
  - 404 state: redirect to /employees if user not found
```

---

## STEP 9 — Frontend: Add/Edit employee modal

### components/employees/EmployeeFormModal.tsx

```
Props:
  open: boolean
  onClose: () => void
  employee?: User  (if provided = edit mode, else = create mode)

Design:
  shadcn Dialog, max-width 560px
  Title: "Add New Employee" or "Edit Employee"

Form fields (React Hook Form + createEmployeeSchema / updateEmployeeSchema):
  Row 1: Full Name (required) | Email (required)
  Row 2: Password (required, create only) | Role (select dropdown)
  Row 3: Department | Manager (searchable select from employees list)
  Row 4: Skills (tag input — type skill + Enter to add, click chip × to remove)

Skill tag input behavior:
  - Text input, press Enter or comma to add a skill tag
  - Each skill shown as indigo chip with × remove button
  - Stored as string array in form state

Manager select:
  - Dropdown showing all active employees
  - Shows Avatar + Name + Role per option
  - Searchable by name
  - "No manager" option at top

Submit button:
  - Create mode: "Add Employee" (primary indigo)
  - Edit mode: "Save Changes" (primary indigo)
  - Loading spinner while mutation pending
  - Disabled while loading

Error handling:
  - Field-level errors from Zod shown below each input
  - "Email already registered" error shown as toast
  - Success: close modal + show success toast + invalidate queries

Avatar upload (edit mode only):
  - Avatar preview at top with "Change photo" overlay on hover
  - Clicking opens file picker (jpg/png/webp only, max 5MB)
  - Uploads immediately on file select via useUploadAvatar hook
  - Shows upload progress
```

---

## STEP 10 — Frontend: Skills filter component

### components/employees/SkillsFilter.tsx

```typescript
// Dropdown showing unique skills from all employees
// Multi-select style — clicking a skill filters the directory
// Skills list: fetched from /api/employees/skills endpoint
// OR: derive from current employee list (simpler for now)
// Sync with nuqs ?skill= param
```

Add endpoint to backend:
```typescript
// GET /api/employees/skills
// Returns unique skills array across all active employees
// server/src/controllers/employee.controller.ts
export const getSkills = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select('user.skills')
      .where('user.is_active = true')
      .getMany()

    const allSkills = users.flatMap((u) => u.skills)
    const unique = [...new Set(allSkills)].sort()
    res.json(unique)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch skills' })
  }
}
```

Register route: `router.get('/skills', getSkills)` — BEFORE `router.get('/:id', getOne)`

---

## STEP 11 — TypeORM migration: ensure users table is correct

Check that the users table migration includes all required columns:
- id (uuid, primary key, default gen_random_uuid())
- name, email, password_hash, role (enum), department, skills (jsonb), avatar_path
- manager_id (uuid, FK → users, nullable)
- is_active (boolean, default true)
- created_at, updated_at

If the migration doesn't exist yet, generate it:
```bash
cd server
npm run migration:generate -- -n CreateUsersTable
npm run migration:run
```

---

## STEP 12 — Seed data (development only)

### server/src/seeds/employees.seed.ts

Create a seed script to populate 10 sample employees for development:

```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import bcrypt from 'bcryptjs'

const employees = [
  { name: 'Sumit Sharma', email: 'sumit@orgsphere.io', role: 'admin', department: 'Engineering', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'] },
  { name: 'Priya Patel', email: 'priya@orgsphere.io', role: 'manager', department: 'Product', skills: ['Product Strategy', 'Agile', 'Roadmapping'] },
  { name: 'Raj Mehta', email: 'raj@orgsphere.io', role: 'tech_lead', department: 'Engineering', skills: ['Go', 'Kubernetes', 'AWS', 'System Design'] },
  { name: 'Ananya Singh', email: 'ananya@orgsphere.io', role: 'employee', department: 'Design', skills: ['Figma', 'UI Design', 'User Research', 'Prototyping'] },
  { name: 'Vikram Nair', email: 'vikram@orgsphere.io', role: 'employee', department: 'Engineering', skills: ['Python', 'FastAPI', 'Machine Learning'] },
  { name: 'Neha Joshi', email: 'neha@orgsphere.io', role: 'employee', department: 'Engineering', skills: ['React', 'TypeScript', 'GraphQL'] },
  { name: 'Amit Kumar', email: 'amit@orgsphere.io', role: 'manager', department: 'Engineering', skills: ['Team Leadership', 'Java', 'Spring Boot'] },
  { name: 'Deepa Iyer', email: 'deepa@orgsphere.io', role: 'employee', department: 'Marketing', skills: ['SEO', 'Content Strategy', 'Analytics'] },
  { name: 'Rahul Gupta', email: 'rahul@orgsphere.io', role: 'tech_lead', department: 'Infrastructure', skills: ['DevOps', 'Terraform', 'Docker', 'Linux'] },
  { name: 'Kavita Sharma', email: 'kavita@orgsphere.io', role: 'employee', department: 'Design', skills: ['Illustration', 'Motion', 'Adobe Creative Suite'] },
]

async function seed() {
  await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(User)

  const password_hash = await bcrypt.hash('Password123!', 12)

  for (const emp of employees) {
    const exists = await repo.findOne({ where: { email: emp.email } })
    if (!exists) {
      const user = repo.create({ ...emp, password_hash } as any)
      await repo.save(user)
      console.log(`✅ Created: ${emp.name}`)
    } else {
      console.log(`⏭️  Skipped (exists): ${emp.name}`)
    }
  }

  // Set manager relationships
  const sumit = await repo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const priya = await repo.findOne({ where: { email: 'priya@orgsphere.io' } })
  const raj = await repo.findOne({ where: { email: 'raj@orgsphere.io' } })
  const amit = await repo.findOne({ where: { email: 'amit@orgsphere.io' } })

  if (raj && sumit) { raj.manager_id = sumit.id; await repo.save(raj) }
  if (priya && sumit) { priya.manager_id = sumit.id; await repo.save(priya) }
  if (amit && sumit) { amit.manager_id = sumit.id; await repo.save(amit) }

  const reports = ['ananya', 'vikram', 'neha'].map(n => `${n}@orgsphere.io`)
  for (const email of reports) {
    const user = await repo.findOne({ where: { email } })
    if (user && raj) { user.manager_id = raj.id; await repo.save(user) }
  }

  console.log('🌱 Seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add seed script to server/package.json:
```json
"seed": "ts-node src/seeds/employees.seed.ts"
```

Run with: `npm run seed`

---

## ACCEPTANCE CRITERIA — Phase 3 is complete when:

Backend:
- [ ] GET /api/employees returns paginated list (page, limit, total, totalPages)
- [ ] GET /api/employees?search=sumit returns filtered results
- [ ] GET /api/employees?role=tech_lead returns filtered results
- [ ] GET /api/employees/:id returns employee with manager + direct_reports
- [ ] POST /api/employees creates new employee (requires auth)
- [ ] PUT /api/employees/:id updates employee fields
- [ ] POST /api/employees/:id/avatar uploads and stores avatar file locally
- [ ] DELETE /api/employees/:id (admin only) soft-deletes (sets is_active=false)
- [ ] GET /api/employees/skills returns unique skills array
- [ ] Seed data: 10 employees visible in PostgreSQL

Frontend:
- [ ] /employees shows grid view with all 10 seeded employees
- [ ] Switching to table view shows same data in table format
- [ ] Search input filters employees in real time (300ms debounce)
- [ ] Role dropdown filters correctly
- [ ] Pagination works — clicking page 2 loads next set
- [ ] "+ Add Employee" button opens modal with form
- [ ] Form validation shows errors for empty required fields
- [ ] Submitting valid form creates employee and refreshes list
- [ ] /employees/:id shows full profile with skills, manager, direct reports
- [ ] Clicking manager name navigates to manager's profile
- [ ] Edit button opens pre-filled form modal
- [ ] Avatar upload works — file picker → preview updates
- [ ] Empty state shows when search returns no results
- [ ] Loading skeleton shows while data is fetching
- [ ] Dashboard employee count reflects real DB count
- [ ] TypeScript zero errors
- [ ] No console errors
