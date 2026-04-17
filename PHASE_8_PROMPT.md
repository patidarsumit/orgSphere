# OrgSphere — Phase 8 Prompt (FINAL)
# Global Search + Settings + App Polish
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are completing OrgSphere — an internal corporate collaboration platform.
Phases 1–7 are complete. This is the final phase.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, RTK, TanStack Query v5, React Hook Form + Zod, nuqs
- Backend: Node.js, Express, TypeORM, PostgreSQL (local, port 5432)
- Auth: JWT Bearer token + httpOnly refresh cookie

---

## WHAT ALREADY EXISTS (do not rebuild)

- All modules: auth, employees, teams, projects, tasks, notes, activity
- App shell: sidebar, header (with search bar UI — not yet wired)
- All pages fully built and working
- Settings page showing stub "coming in Phase 8"
- Header search bar UI exists but does nothing on click

---

## TASK — Phase 8: Global Search + Settings + Polish

This phase has three parts:
1. Global Search — backend multi-entity search + frontend overlay
2. Settings page — admin panel with 4 tabs fully built
3. App polish — empty states, error boundaries, toast system, loading UX, 404s

---

## PART A — GLOBAL SEARCH

---

## STEP 1 — Backend: Search endpoint

### server/src/controllers/search.controller.ts
```typescript
import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { ILike } from 'typeorm'
import { AuthRequest } from '../middleware/auth'

export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string)?.trim()

    if (!q || q.length < 2) {
      res.json({ projects: [], employees: [], teams: [], query: q })
      return
    }

    const pattern = `%${q}%`
    const LIMIT = 5

    const [projects, employees, teams] = await Promise.all([
      // Search projects by name
      AppDataSource.getRepository(Project)
        .createQueryBuilder('project')
        .leftJoin('project.manager', 'manager')
        .select([
          'project.id', 'project.name', 'project.status', 'project.tech_stack',
          'manager.id', 'manager.name',
        ])
        .where('project.name ILIKE :pattern', { pattern })
        .take(LIMIT)
        .getMany(),

      // Search employees by name or email
      AppDataSource.getRepository(User)
        .createQueryBuilder('user')
        .select([
          'user.id', 'user.name', 'user.email',
          'user.role', 'user.avatar_path', 'user.department',
        ])
        .where('user.name ILIKE :pattern OR user.email ILIKE :pattern', { pattern })
        .andWhere('user.is_active = true')
        .take(LIMIT)
        .getMany(),

      // Search teams by name
      AppDataSource.getRepository(Team)
        .createQueryBuilder('team')
        .leftJoin('team.members', 'member')
        .select([
          'team.id', 'team.name', 'team.description',
          'member.id',
        ])
        .where('team.name ILIKE :pattern', { pattern })
        .take(LIMIT)
        .getMany(),
    ])

    res.json({
      query: q,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        tech_stack: p.tech_stack,
        manager_name: (p as any).manager?.name ?? null,
        type: 'project',
      })),
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        avatar_path: e.avatar_path,
        department: e.department,
        type: 'employee',
      })),
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        member_count: (t as any).members?.length ?? 0,
        type: 'team',
      })),
      total:
        projects.length + employees.length + teams.length,
    })
  } catch (error) {
    res.status(500).json({ message: 'Search failed' })
  }
}
```

### server/src/routes/search.routes.ts
```typescript
import { Router } from 'express'
import { globalSearch } from '../controllers/search.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.get('/', authMiddleware, globalSearch)
export default router
```

Register in app.ts:
```typescript
import searchRoutes from './routes/search.routes'
app.use('/api/search', searchRoutes)
```

---

## STEP 2 — Frontend: Search types + hook

### Add to client/types/index.ts
```typescript
export interface SearchResult {
  id: string
  name: string
  type: 'project' | 'employee' | 'team'
  // project fields
  status?: ProjectStatus
  tech_stack?: string[]
  manager_name?: string | null
  // employee fields
  email?: string
  role?: UserRole
  avatar_path?: string | null
  department?: string | null
  // team fields
  description?: string | null
  member_count?: number
}

export interface SearchResponse {
  query: string
  projects: SearchResult[]
  employees: SearchResult[]
  teams: SearchResult[]
  total: number
}
```

### client/hooks/useSearch.ts
```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { SearchResponse } from '@/types'

export const useSearch = (query: string) => {
  return useQuery<SearchResponse>({
    queryKey: ['search', query],
    queryFn: async () => {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`)
      return data
    },
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
    gcTime: 30_000,
  })
}
```

---

## STEP 3 — Frontend: Global Search overlay component

### components/search/GlobalSearch.tsx

This is the search overlay that appears when the header search bar is clicked.

```
TRIGGER:
  - Clicking the header search bar opens the overlay
  - Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
  - Wire shortcut in a useEffect on window keydown
  - Managed via uiSlice: openModal('global-search') / closeModal()
  - OR use local useState in Header — simpler, preferred

OVERLAY DESIGN:
  Backdrop: fixed inset-0, bg-black/30, z-50, clicking backdrop closes
  Panel: fixed top-20 left-1/2 -translate-x-1/2
         width: 560px (max-w-[560px] w-full mx-4)
         bg-white, rounded-xl, shadow-xl, border gray-100
         max-height: 540px

PANEL STRUCTURE:
┌─────────────────────────────────────────────┐
│ [🔍] Search projects, people, teams...       │ ← search input (autofocus)
│                                   [ESC] ×   │
├─────────────────────────────────────────────┤
│ RECENT SEARCHES                             │ ← shown when input empty
│  [clock] Alpha Platform                     │
│  [clock] Sumit Sharma                       │
├─────────────────────────────────────────────┤
│ PROJECTS (3)                                │ ← shown when results exist
│  [●] Alpha Platform    ACTIVE  React Node   │
│  [●] Beta Analytics    ACTIVE  Python       │
│  See all projects for "query" →             │
├─────────────────────────────────────────────┤
│ EMPLOYEES (2)                               │
│  [Avatar] Sumit Sharma    Admin             │
│  [Avatar] Raj Mehta       Tech Lead        │
│  See all employees for "query" →            │
├─────────────────────────────────────────────┤
│ TEAMS (1)                                   │
│  [●] Platform Team    5 members             │
│  See all teams for "query" →                │
└─────────────────────────────────────────────┘

SEARCH INPUT:
  - height: 52px, font-size 16px
  - Search icon (20px) left, padded
  - ESC key or × button closes overlay
  - Input has autofocus when overlay opens
  - Debounced 300ms before firing query
  - Show spinner in input right side while loading

RECENT SEARCHES (shown when query is empty):
  - Store last 5 searches in localStorage key 'orgsphere_recent_searches'
  - Array of { query, type, resultId } objects
  - Each shows clock icon + query text
  - Clicking re-runs that search
  - "Clear" link removes all recent searches
  - If no recent searches: show keyboard shortcut hint
    "Tip: Press ⌘K anywhere to search"

RESULTS SECTION (shown when query.length >= 2):

  Each result group:
    - Section header: "PROJECTS (N)" in 11px uppercase gray
    - Up to 3 results shown per group
    - "See all X results →" link at bottom (navigates to /projects?search=query)

  Project result row (48px):
    [status dot] Project name (14px/500)  status badge  tech chips (2 max)
    Clicking → /projects/:id + close overlay + save to recent

  Employee result row (48px):
    [Avatar 32px] Name (14px/500)  Role badge  Department (gray, right)
    Clicking → /employees/:id + close overlay + save to recent

  Team result row (48px):
    [colored circle + letter] Team name (14px/500)  N members (gray, right)
    Clicking → /teams/:id + close overlay + save to recent

NO RESULTS STATE (query.length >= 2, total === 0):
  Centered: search icon (gray, 40px) + "No results for '{query}'"
  Subtext: "Try searching for a project name, employee, or team"

LOADING STATE (isLoading=true):
  3 skeleton rows per section (gray pulse)

KEYBOARD NAVIGATION:
  - Arrow Up/Down to move between results
  - Enter to navigate to focused result
  - ESC to close
  - Tab moves between sections

SAVE TO RECENT:
  On any result click:
    const recent = JSON.parse(localStorage.getItem('orgsphere_recent_searches') || '[]')
    const newEntry = { query: currentQuery, timestamp: Date.now() }
    const updated = [newEntry, ...recent.filter(r => r.query !== currentQuery)].slice(0, 5)
    localStorage.setItem('orgsphere_recent_searches', JSON.stringify(updated))
```

---

## STEP 4 — Frontend: Wire search in Header

### Update components/layout/Header.tsx

```typescript
// Replace the static search input with GlobalSearch trigger:

const [searchOpen, setSearchOpen] = useState(false)

// Keyboard shortcut
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen(true)
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])

// Search bar (not a real input — just a trigger button):
<button
  onClick={() => setSearchOpen(true)}
  className="flex items-center gap-2 px-3 h-9 w-80 rounded-lg
             bg-gray-50 border border-gray-200 text-gray-400 text-sm
             hover:border-gray-300 hover:bg-white transition-colors"
>
  <SearchIcon size={15} />
  <span className="flex-1 text-left">Search projects, people, teams...</span>
  <kbd className="hidden sm:flex items-center gap-0.5 text-xs
                  bg-white border border-gray-200 rounded px-1.5 py-0.5">
    ⌘K
  </kbd>
</button>

{searchOpen && (
  <GlobalSearch onClose={() => setSearchOpen(false)} />
)}
```

---

## PART B — SETTINGS PAGE

---

## STEP 5 — Backend: Settings endpoints

### server/src/controllers/settings.controller.ts
```typescript
import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { AuthRequest } from '../middleware/auth'
import bcrypt from 'bcryptjs'

// GET /api/settings/overview — admin dashboard stats
export const getOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalProjects, totalTeams] = await Promise.all([
      AppDataSource.getRepository(User).count({ where: { is_active: true } }),
      AppDataSource.getRepository(Project).count(),
      AppDataSource.getRepository(Team).count(),
    ])
    res.json({ totalUsers, totalProjects, totalTeams })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch overview' })
  }
}

// GET /api/settings/roles — get all users with roles (for role management)
export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.role', 'user.avatar_path', 'user.is_active'])
      .orderBy('user.role', 'ASC')
      .addOrderBy('user.name', 'ASC')
      .getMany()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roles' })
  }
}

// PUT /api/settings/roles/:userId — change user role (admin only)
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body
    const validRoles = ['admin', 'manager', 'tech_lead', 'employee']

    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Invalid role' })
      return
    }

    // Prevent demoting yourself
    if (req.params.userId === req.user!.id && role !== 'admin') {
      res.status(400).json({ message: 'Cannot change your own admin role' })
      return
    }

    await AppDataSource.getRepository(User).update(
      { id: req.params.userId },
      { role }
    )
    res.json({ message: 'Role updated successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' })
  }
}

// PUT /api/settings/profile — update own profile settings
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, department } = req.body
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({ where: { id: req.user!.id } })
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    if (name) user.name = name
    if (department !== undefined) user.department = department
    const saved = await repo.save(user)

    const { password_hash, ...safe } = saved as any
    res.json(safe)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' })
  }
}

// PUT /api/settings/password — change own password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body
    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOne({ where: { id: req.user!.id } })
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    const isValid = await bcrypt.compare(current_password, user.password_hash)
    if (!isValid) {
      res.status(400).json({ message: 'Current password is incorrect' })
      return
    }

    if (new_password.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters' })
      return
    }

    user.password_hash = await bcrypt.hash(new_password, 12)
    await repo.save(user)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' })
  }
}
```

### server/src/routes/settings.routes.ts
```typescript
import { Router } from 'express'
import {
  getOverview, getRoles, updateRole,
  updateProfile, changePassword
} from '../controllers/settings.controller'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/overview', adminOnly, getOverview)
router.get('/roles', adminOnly, getRoles)
router.put('/roles/:userId', adminOnly, updateRole)
router.put('/profile', updateProfile)
router.put('/password', changePassword)

export default router
```

Register in app.ts:
```typescript
import settingsRoutes from './routes/settings.routes'
app.use('/api/settings', settingsRoutes)
```

---

## STEP 6 — Frontend: Settings page

### app/(app)/settings/page.tsx

Replace the stub with the full Settings page.
This page is accessible to admin role only — redirect non-admins to /dashboard.

```typescript
'use client'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RootState } from '@/store'

// Auth guard — redirect non-admins
const user = useSelector((state: RootState) => state.auth.user)
const router = useRouter()
useEffect(() => {
  if (user && user.role !== 'admin') router.push('/dashboard')
}, [user])
```

```
LAYOUT:
- PageHeader: title="Settings" subtitle="Manage your OrgSphere workspace"
- Two-column layout:
    Left: vertical tab nav (200px)
    Right: tab content (flex-1)

LEFT TAB NAV (200px, white card, rounded-xl, border):
  Each tab item (36px height, rounded-lg, px-3):
    icon (16px) + label
    Active: indigo-50 bg + indigo-600 text + left 2px indigo border
    Hover: gray-100

  Tabs:
    [User icon]      General
    [Users icon]     Employees
    [FolderKanban]   Projects
    [UsersRound]     Teams
    [Shield icon]    Roles & Permissions
    [Key icon]       My Account

TAB: GENERAL
  Card: "Organization Settings"
  Fields:
    Company Name (input, read-only for now — just display "OrgSphere")
    Default Timezone (select — show common timezones)
    Date Format (select — MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  Stats section (3 cards):
    Total Employees | Total Projects | Total Teams
    Data from GET /api/settings/overview
  Save Changes button (primary indigo)
  Discard Changes button (secondary)

TAB: EMPLOYEES
  Header: "Manage Employees" + "+ Add Employee" button (opens same EmployeeFormModal from Phase 3)

  Table: all employees (paginated, 10 per page)
  Columns: Avatar+Name | Email | Role badge | Department | Status | Actions

  Status toggle:
    Active employees: green "Active" badge + "Deactivate" action
    Inactive employees: gray "Inactive" badge + "Reactivate" action

  Actions (3-dot menu per row):
    View Profile → /employees/:id
    Edit → opens EmployeeFormModal
    Change Role → opens inline role select dropdown
    Deactivate / Reactivate → ConfirmDialog

  Reactivate endpoint: PUT /api/employees/:id with { is_active: true }
  (already handled by existing update endpoint)

  Search bar above table: filter by name/email

TAB: PROJECTS
  Header: "Manage Projects" + "+ Add Project" button

  Table: all projects
  Columns: Name | Status | Team | Manager | Tech Stack | Created | Actions

  Actions:
    View → /projects/:id
    Edit → ProjectFormModal
    Archive → changes status to 'archived' (PUT with { status: 'archived' })
    Delete → ConfirmDialog → DELETE /api/projects/:id

  Status filter chips: All / Active / Completed / On Hold / Archived

TAB: TEAMS
  Header: "Manage Teams" + "+ Create Team" button

  Table: all teams
  Columns: Name | Description | Members | Projects | Created | Actions

  Actions:
    View → /teams/:id
    Edit → TeamFormModal
    Delete → ConfirmDialog

TAB: ROLES & PERMISSIONS
  Header: "Roles & Permissions"
  Subtitle: "Control what each role can do in OrgSphere"

  ROLE PERMISSION TABLE:
  ┌──────────────┬─────────┬──────────┬────────┬────────────┐
  │ Role         │ View    │ Create   │ Edit   │ Delete     │
  ├──────────────┼─────────┼──────────┼────────┼────────────┤
  │ Admin        │  ✓ All  │  ✓ All   │ ✓ All  │ ✓ All      │
  │ Manager      │  ✓ All  │ ✓ Proj   │ ✓ Own  │ ✗          │
  │ Tech Lead    │  ✓ All  │ ✓ Tasks  │ ✓ Own  │ ✗          │
  │ Employee     │  ✓ All  │ ✓ Tasks  │ ✓ Own  │ ✗          │
  └──────────────┴─────────┴──────────┴────────┴────────────┘
  (Static display table — permissions are role-based in backend, not configurable)
  Note below: "Permissions are enforced at the API level."

  ASSIGN ROLES section (below table):
  Header: "User Role Assignments"
  List of all users: Avatar + Name + current Role badge + "Change Role" button
  Clicking "Change Role":
    Opens small inline dropdown (or modal) with role options
    Saves via PUT /api/settings/roles/:userId
    Shows success toast
    Invalidates roles query

TAB: MY ACCOUNT
  Header: "My Account Settings"
  Two cards:

  Card 1 — Profile Information:
    Avatar (64px) with "Change photo" overlay → reuse avatar upload from employee module
    Full Name input
    Email (read-only, gray)
    Department input
    Save Changes button → PUT /api/settings/profile
    Updates RTK auth.user on success via dispatch(setCredentials())

  Card 2 — Change Password:
    Current Password (input, type=password, show/hide toggle)
    New Password (input, type=password, show/hide toggle)
    Confirm New Password (input — validated client-side to match)
    "Update Password" button → PUT /api/settings/password
    Success: toast "Password updated" + clear form
    Error: show inline error message
```

---

## PART C — APP POLISH

---

## STEP 7 — Toast notification system

### components/shared/ToastProvider.tsx

Build a global toast notification system using the RTK uiSlice:

```typescript
// Renders in app/(app)/layout.tsx below the main content
// Reads toasts from Redux: useSelector((s) => s.ui.toasts)
// Each toast auto-dismisses after 4 seconds
// Dispatches removeToast after 4000ms timeout

// Position: fixed bottom-right (bottom-6 right-6), z-50
// Stack: multiple toasts stack vertically with 8px gap

// Toast design (240px wide, white, rounded-xl, shadow-lg, border):
// Left color bar (4px) based on type:
//   success = green, error = red, warning = amber, info = blue
// Icon (16px): CheckCircle/XCircle/AlertTriangle/Info
// Message (13px/500)
// × close button (right)
// Smooth slide-in from right + fade-out on dismiss

// Helper hook for convenience:
// useToast() returns { success, error, warning, info } functions
// Usage: const { success } = useToast(); success('Employee created!')
```

### client/hooks/useToast.ts
```typescript
import { useDispatch } from 'react-redux'
import { addToast } from '@/store/slices/uiSlice'

export const useToast = () => {
  const dispatch = useDispatch()

  const toast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    dispatch(addToast({ type, message }))
  }

  return {
    success: (msg: string) => toast('success', msg),
    error:   (msg: string) => toast('error', msg),
    warning: (msg: string) => toast('warning', msg),
    info:    (msg: string) => toast('info', msg),
  }
}
```

Replace ALL existing toast calls across the app with this unified system.
Go through every modal and mutation onSuccess/onError and use useToast().

---

## STEP 8 — Error boundary

### components/shared/ErrorBoundary.tsx
```typescript
'use client'
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            An unexpected error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-indigo-600 hover:underline"
          >
            Refresh page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Wrap each major page section in ErrorBoundary in app/(app)/layout.tsx:
```typescript
<main className="flex-1 overflow-y-auto p-8">
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
</main>
```

---

## STEP 9 — Global loading bar

### components/shared/LoadingBar.tsx

Top-of-page loading bar that shows during route transitions:

```typescript
'use client'
// Shows a thin indigo progress bar at the very top of the page
// Triggers on route change start, completes on route change end
// Use usePathname() + useEffect to detect navigation
// Animate: 0% → 70% quickly, then pause, then 100% + fade out
// Position: fixed top-0 left-0 right-0, height 3px, z-[100]
// Color: bg-indigo-500
// Only show if taking more than 100ms (debounced)
```

Add to app/(app)/layout.tsx above the sidebar/content:
```typescript
<LoadingBar />
```

---

## STEP 10 — Polish: Consistent empty states across all pages

Audit every list page and ensure EmptyState is used consistently.

For each page, ensure these two states are handled:

### Zero data state (no items at all):
Use EmptyState component with:
- Relevant icon (lucide)
- "No {items} yet" title
- "Get started by creating your first {item}" description
- Primary CTA button opening the create modal

### Zero results state (filters/search returned nothing):
- Same EmptyState component but different copy:
- "No results found" title
- "Try adjusting your search or filters" description
- "Clear filters" button

Pages to audit:
- /projects — ✓ should already have it, verify both states
- /employees — ✓ verify both states
- /teams — ✓ verify both states
- /my/tasks — ✓ verify list AND kanban empty states
- /my/notes — ✓ verify left panel empty state
- /settings (employees/projects/teams tabs) — add empty states

---

## STEP 11 — Polish: Page titles (metadata)

Add proper metadata to every page for browser tab titles:

### Pattern for each page:
```typescript
// Static pages:
export const metadata = {
  title: 'Projects | OrgSphere',
}

// Dynamic pages (use generateMetadata):
export async function generateMetadata({ params }: { params: { id: string } }) {
  // fetch project name from API
  return { title: `${projectName} | OrgSphere` }
}
```

Pages to update:
- / (landing) → "OrgSphere — Know your organization"
- /login → "Login | OrgSphere"
- /dashboard → "Dashboard | OrgSphere"
- /projects → "Projects | OrgSphere"
- /projects/[id] → "{Project Name} | OrgSphere"
- /employees → "Employees | OrgSphere"
- /employees/[id] → "{Employee Name} | OrgSphere"
- /teams → "Teams | OrgSphere"
- /teams/[id] → "{Team Name} | OrgSphere"
- /my/dashboard → "My Dashboard | OrgSphere"
- /my/tasks → "My Tasks | OrgSphere"
- /my/notes → "My Notes | OrgSphere"
- /settings → "Settings | OrgSphere"

---

## STEP 12 — Polish: API error handling

### Update client/lib/axios.ts

Improve error handling in the Axios interceptor:

```typescript
// On response error (non-401):
// Extract error message from response body
// Dispatch addToast with error message for 500 errors
// For 400 validation errors: return the errors object for form handling
// For 404 errors: do NOT show toast (handle in component)
// For 409 conflicts: return for component to handle (e.g. email exists)
// For 500 server errors: show generic error toast

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ... existing 401 refresh logic ...

    // For other errors, add helpful context
    if (error.response?.status === 500) {
      // Could dispatch toast here, but better to let components handle it
      console.error('Server error:', error.response.data)
    }

    return Promise.reject(error)
  }
)
```

### Update all mutations to have onError handlers:

Go through every useMutation in all hook files and add:
```typescript
onError: (error: any) => {
  const message = error.response?.data?.message ?? 'Something went wrong'
  // Components should call useToast().error(message)
}
```

---

## STEP 13 — Polish: Breadcrumb component (final version)

### components/layout/Breadcrumb.tsx

Build a proper dynamic breadcrumb based on the current route:

```typescript
// Route → Breadcrumb mapping:
// /dashboard              → Dashboard
// /projects               → Projects
// /projects/[id]          → Projects > {project.name}
// /employees              → Employees
// /employees/[id]         → Employees > {employee.name}
// /teams                  → Teams
// /teams/[id]             → Teams > {team.name}
// /my/dashboard           → My Workspace > My Dashboard
// /my/tasks               → My Workspace > My Tasks
// /my/notes               → My Workspace > My Notes
// /settings               → Settings

// Design:
// Each segment: gray-400, 13px
// Separator: / or › character, gray-300
// Last segment: gray-900, 13px/500 (current page)
// Parent segments: clickable links

// For dynamic segments (/projects/[id]):
// Show loading skeleton (gray pulse, 80px) while fetching name
// Once loaded: show entity name
// Entity names fetched from TanStack Query cache (already loaded on most pages)
// If not in cache: show "..." fallback
```

---

## STEP 14 — Polish: Mobile sidebar improvements

### Update components/layout/Sidebar.tsx

Improve mobile behavior:

```typescript
// Mobile sidebar behavior:
// - Width: 240px, slides in from left
// - Overlay: semi-transparent black bg behind sidebar
// - Clicking overlay closes sidebar
// - Transition: transform translateX(-240px) → translateX(0)
// - Duration: 200ms ease-in-out

// Add to uiSlice if not already there:
// sidebarOpen: true by default on desktop (>= 768px)
// sidebarOpen: false by default on mobile (< 768px)

// Detect on mount:
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 768) dispatch(setSidebarOpen(false))
    else dispatch(setSidebarOpen(true))
  }
  handleResize()
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

## STEP 15 — Polish: Favicon and app icon

### public/favicon.ico and public/icon.svg

Create a simple OrgSphere favicon:

```typescript
// Create public/icon.svg:
// Simple SVG: indigo circle (40x40) with white "O" letter centered
// Or: use the indigo dot that's in the sidebar logo

// Update app/layout.tsx metadata:
export const metadata: Metadata = {
  title: 'OrgSphere',
  description: 'Know your organization from every angle',
  icons: {
    icon: '/icon.svg',
  },
}
```

---

## STEP 16 — Final integration: Wire search into all "See all" links

When a user clicks "See all employees for 'react'" from the search overlay:
- Navigate to /employees?search=react
- The employees page should read ?search= from nuqs on mount
- The search input should be pre-filled with the query
- Results should be filtered immediately

This should already work if nuqs is properly set up on each list page.
Verify that all three "See all" links in the search overlay work:
- "See all projects for '{query}'" → /projects?search={query}
- "See all employees for '{query}'" → /employees?search={query}
- "See all teams for '{query}'" → /teams?search={query}

---

## STEP 17 — Final: Full app smoke test + bug fixes

After all steps above are complete, do a full walkthrough of the app
and fix any remaining visual or functional issues:

Smoke test checklist:
1. Landing page → Login → Dashboard (check all 4 stat cards)
2. Add a new employee → verify in directory + dashboard count updates
3. Create a new team → add members → verify team detail
4. Create a new project → assign team + manager + tech lead
5. Open project detail → all 5 tabs load correctly
6. Navigate to employee profile → teams + projects show correctly
7. Go to My Tasks → add task → mark as done → verify in kanban
8. Go to My Notes → create note → type in editor → verify auto-save
9. Go to My Dashboard → verify all 3 stats + today's tasks + recent notes
10. Use Cmd+K search → search "alpha" → verify results → click result
11. Open notification bell → verify activities show → mark as read
12. Go to Settings → Roles tab → change a role → verify update
13. Settings → My Account → update name → verify RTK store updates
14. Logout → verify redirect to login → verify refresh token cleared
15. Try accessing /dashboard without logging in → verify redirect to /login

---

## ACCEPTANCE CRITERIA — Phase 8 is complete when:

Backend — Search:
- [ ] GET /api/search?q=alpha returns projects + employees + teams matching "alpha"
- [ ] GET /api/search?q=a (1 char) returns empty results (min 2 chars)
- [ ] GET /api/search?q=sumit returns employee Sumit in results
- [ ] All three entity types returned in single response

Backend — Settings:
- [ ] GET /api/settings/overview returns correct counts (admin only)
- [ ] GET /api/settings/roles returns all users with roles (admin only)
- [ ] PUT /api/settings/roles/:userId updates user role
- [ ] Cannot change own role if admin
- [ ] PUT /api/settings/profile updates name + department
- [ ] PUT /api/settings/password validates current password + updates

Frontend — Global Search:
- [ ] Clicking header search bar opens overlay
- [ ] Cmd+K / Ctrl+K opens overlay from anywhere in the app
- [ ] Typing "alpha" shows Alpha Platform in projects section
- [ ] Typing "sumit" shows Sumit Sharma in employees section
- [ ] Typing "platform" shows Platform Team in teams section
- [ ] Clicking a result navigates to correct page + closes overlay
- [ ] ESC key closes the overlay
- [ ] Recent searches stored in localStorage + shown when input empty
- [ ] "See all X for '{query}'" links navigate to correct filtered page
- [ ] No results state shows correctly
- [ ] Loading state (skeleton) shows while fetching
- [ ] Keyboard navigation (arrow keys + enter) works

Frontend — Settings:
- [ ] /settings redirects non-admin users to /dashboard
- [ ] General tab shows overview stats from real API
- [ ] Employees tab shows paginated employee list with all actions
- [ ] Deactivate employee works + is_active updates in DB
- [ ] Projects tab shows all projects with archive + delete actions
- [ ] Teams tab shows all teams with delete action
- [ ] Roles tab shows permission matrix + user role list
- [ ] Changing a user's role via Settings updates in DB
- [ ] My Account tab: update name → RTK store updates → header shows new name
- [ ] My Account: change password → old password rejected after change

Frontend — Polish:
- [ ] Toast system works across all pages (success/error/warning)
- [ ] All mutations show success toast on completion
- [ ] All mutations show error toast on failure
- [ ] Error boundary shows fallback UI on unexpected errors
- [ ] Loading bar shows during route transitions
- [ ] All pages have correct browser tab titles
- [ ] Empty states present on all list pages (both zero-data + no-results)
- [ ] Breadcrumb shows correct path on all pages
- [ ] Mobile: sidebar slides in/out correctly with overlay
- [ ] Favicon shows in browser tab

Full smoke test:
- [ ] All 17 smoke test steps from Step 17 pass without errors
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
- [ ] No 404s on any navigation path
- [ ] App works correctly after browser refresh on any page
