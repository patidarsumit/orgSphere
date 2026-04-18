# OrgSphere — Phase 2 Prompt
# App Shell + Navigation + Landing Page + Dashboard Skeleton
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are continuing to build OrgSphere — an internal corporate collaboration platform.
Phase 1 (auth) is already complete and working.

Read ARCHITECTURE.md at the project root before writing any code.

Stack reminder:
- Frontend: Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, Redux Toolkit, TanStack Query
- Backend: Node.js, Express, TypeORM, PostgreSQL (local)
- Auth: JWT (access token in RTK store, refresh token in httpOnly cookie) — already built

---

## TASK — Phase 2: App Shell + Navigation + Landing Page

Build the permanent application shell that every future page will live inside.
Also build the public landing page and wire the dashboard with real stat counts from the API.

---

## WHAT ALREADY EXISTS (do not rebuild)

- /client/app/layout.tsx — root layout with Providers
- /client/app/(public)/login/page.tsx — login page
- /client/app/(app)/layout.tsx — protected layout shell (basic version)
- /client/store/ — RTK store with authSlice + uiSlice
- /client/lib/axios.ts — Axios instance with interceptors
- /server/src/entities/User.ts
- /server/src/routes/auth.routes.ts
- All auth controllers and middleware

---

## STEP 1 — Backend: Dashboard stats endpoint

Add a new route to the Express server for dashboard statistics.

### server/src/controllers/dashboard.controller.ts
```typescript
import { Request, Response } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import { AuthRequest } from '../middleware/auth'

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User)

    const totalEmployees = await userRepo.count({ where: { is_active: true } })

    // Projects and teams will return 0 for now — populated in Phase 5 and 4
    res.json({
      totalProjects: 0,
      totalEmployees,
      activeTeams: 0,
      myOpenTasks: 0,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}
```

### server/src/routes/dashboard.routes.ts
```typescript
import { Router } from 'express'
import { getStats } from '../controllers/dashboard.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()
router.get('/stats', authMiddleware, getStats)
export default router
```

Register in server/src/app.ts:
```typescript
import dashboardRoutes from './routes/dashboard.routes'
app.use('/api/dashboard', dashboardRoutes)
```

---

## STEP 2 — Shared reusable components

Build these components in /client/components/shared/.
These are used across every page from Phase 3 onwards.
Build them properly now — do not cut corners.

### components/shared/StatCard.tsx
```typescript
// Props: title, value, subtitle?, icon (lucide), accentColor?
// Design: white card, radius-xl, subtle shadow
// Large number (32px/600), muted label above (12px), subtitle below (12px gray)
// Icon in a colored circle top-right
// Optional: trend indicator (e.g. "+12% from last month" in green)
// Skeleton loading state when value is undefined
```

### components/shared/PageHeader.tsx
```typescript
// Props: title, subtitle?, actions? (ReactNode), breadcrumb?
// Design: page title (24px/600) + subtitle (14px gray) left
// Actions slot on the right (for "+ Add" buttons)
// Bottom border separator
// Used on every main page
```

### components/shared/StatusBadge.tsx
```typescript
// Props: status (string)
// Maps status strings to colors:
//   'active' | 'done' | 'completed' -> green bg + green text
//   'in_progress' | 'in progress' -> amber bg + amber text
//   'blocked' | 'on_hold' -> red bg + red text
//   'todo' | 'planned' -> blue bg + blue text
//   'archived' -> gray bg + gray text
// Style: rounded-full, 12px font, 4px 10px padding
// Capitalize display text
```

### components/shared/Avatar.tsx
```typescript
// Props: name, avatarPath?, size? ('sm'|'md'|'lg'), showTooltip?
// sm = 24px, md = 32px, lg = 48px, xl = 64px
// If avatarPath: show <img> from http://localhost:4000/{avatarPath}
// If no avatarPath: show initials (first + last name initials)
// Initials background: deterministic color based on name string
//   hash name -> pick from 8 colors (indigo, teal, purple, amber, green, coral, blue, pink)
// Border: 2px white ring (for stacked avatars)
```

### components/shared/AvatarStack.tsx
```typescript
// Props: users (Array<{name, avatarPath?}>), max? (default 4)
// Shows up to max avatars overlapping (-8px margin)
// If more than max: shows "+N" circle in gray
// Used in project cards and team cards
```

### components/shared/EmptyState.tsx
```typescript
// Props: icon (lucide), title, description, action? ({label, onClick})
// Design: centered vertically, icon in light gray circle (48px)
// Title 16px/500, description 14px gray, primary button below
// Used on every list/table page when no data
```

### components/shared/LoadingSpinner.tsx
```typescript
// Props: size? ('sm'|'md'|'lg'), fullPage?
// Indigo spinning ring
// fullPage: centered in viewport with overlay
```

### components/shared/ConfirmDialog.tsx
```typescript
// Props: open, title, description, onConfirm, onCancel, dangerous?
// Uses shadcn AlertDialog
// dangerous=true: confirm button is red
// Used for delete confirmations throughout the app
```

---

## STEP 3 — Landing page (public route)

### app/(public)/page.tsx

Build the full landing page matching the Stitch design exactly.
This is a public page — no sidebar, no header.

#### Section 1 — Navbar
```
- Fixed top, white background, bottom border gray-100
- Left: OrgSphere logo (indigo dot + "OrgSphere" wordmark, 18px/600)
- Right: "Login" button (outlined, indigo border + text, routes to /login)
- Height: 56px
- Max width: 1200px centered
```

#### Section 2 — Hero
```
- Background: #F9FAFB (gray-50)
- "NOW IN PRIVATE BETA" pill badge (indigo bg, white text, centered above headline)
- Headline (48px/700): "Know your organization."
- Subheadline (48px/700, indigo color): "From every angle."
- Body text (18px/400, gray-500, max-width 520px, centered):
  "OrgSphere connects your projects, people, and teams in one unified
  workspace — so everyone always knows what's happening and who's responsible."
- Two CTA buttons side by side:
  Primary: "Get Started →" (indigo bg, white text, routes to /login)
  Secondary: "See how it works" (text link, gray, with arrow icon)
- Stats row (3 items, centered, 40px margin-top):
  "500+ Companies" | "10,000+ Employees Connected" | "99.9% Uptime"
  Each: bold number + gray label below, separated by vertical dividers
- App preview mockup: dark rounded container (border-radius 16px)
  showing a placeholder screenshot or a simple dashboard mockup illustration
  Label it "App Preview" with a subtle inner glow
```

#### Section 3 — Features
```
- Background: white
- Section heading (32px/600, centered): "The architecture of collaboration"
- Subheading (16px, gray, centered): "Modern tools for modern hierarchies."
- 3-column grid (gap 32px):
  Card 1 — Project Visibility
    Icon: FolderKanban (indigo, 24px, in indigo-50 circle)
    Title: "Project Visibility" (16px/600)
    Body: "Eliminate silos with transparent project tracking.
           See dependencies and timelines across the entire organization."
    Link: "Learn more →"
  Card 2 — Team Directory
    Icon: UsersRound
    Title: "Team Directory"
    Body: "Dynamic org charts that actually work. Understand reporting
           lines and expertise clusters without the administrative overhead."
    Link: "Explore structure →"
  Card 3 — Personal Workspace
    Icon: House
    Title: "Personal Workspace"
    Body: "A focused sanctuary for individual contributors. Tailored views
           that pull relevant data from across your various team assignments."
    Link: "View demo →"
```

#### Section 4 — CTA Banner
```
- Background: indigo-600
- Heading (white, 32px/600): "Ready to unify your workspace?"
- Subtext (white/80, 16px): "Join hundreds of organizations transforming
  their culture through radical clarity and connection."
- Two buttons:
  Primary: "Create Your Space" (white bg, indigo text)
  Secondary: "Contact Sales" (white outlined)
```

#### Section 5 — Footer
```
- Background: white, top border gray-100
- Left: OrgSphere logo + tagline "The architectural curator for modern
  organizational excellence."
- Right: 4 column link groups:
  PRODUCT: Features, Integrations, Pricing, Changelog
  COMPANY: About Us, Careers, Blog, Contact
  SUPPORT: Documentation, Help Center, API Status
  LEGAL: Privacy, Terms, Cookies
- Bottom bar: "© 2025 OrgSphere Technologies Inc. All rights reserved."
```

---

## STEP 4 — App shell layout (replace basic version)

### app/(app)/layout.tsx

Replace the basic protected layout with the full production shell.

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setCredentials, setLoading } from '@/store/slices/authSlice'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import api from '@/lib/axios'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  // On mount: try to restore session via refresh token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
      } catch {
        dispatch(setLoading(false))
        router.push('/login')
      }
    }

    if (!isAuthenticated) {
      restoreSession()
    } else {
      dispatch(setLoading(false))
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading OrgSphere...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## STEP 5 — Sidebar component (final, locked version)

### components/layout/Sidebar.tsx

Build the production sidebar. This never changes after Phase 2.

```
Design:
- Width: 240px fixed
- Background: white
- Right border: 1px solid #F3F4F6 (gray-100)
- Full height, no overflow

Structure:
┌─────────────────────────┐
│  [●] OrgSphere          │  ← Logo (24px indigo dot + wordmark)
│      ENTERPRISE SPACE   │  ← Subtitle (10px, gray-400, uppercase)
├─────────────────────────┤
│  ORGANIZATION           │  ← Section label (10px, gray-400, uppercase, px-4)
│  [icon] Dashboard       │  ← Nav item
│  [icon] Projects        │
│  [icon] Employees       │
│  [icon] Teams           │
├─────────────────────────┤
│  MY WORKSPACE           │
│  [icon] My Dashboard    │
│  [icon] My Tasks        │
│  [icon] My Notes        │
├─────────────────────────┤
│  ADMIN                  │  ← Only visible if user.role === 'admin'
│  [icon] Settings        │
├─────────────────────────┤
│                         │
│  [avatar] Name          │  ← Bottom user section
│           Role          │
│  [logout icon]          │
└─────────────────────────┘

Nav item styles:
- Height: 36px
- Padding: px-3
- Border radius: rounded-lg
- Default: text-gray-600, hover:bg-gray-100
- Active: bg-indigo-50, text-indigo-600, border-l-2 border-indigo-600

Icons (lucide-react, 16px):
- Dashboard: LayoutDashboard
- Projects: FolderKanban
- Employees: Users
- Teams: UsersRound
- My Dashboard: House
- My Tasks: CheckSquare
- My Notes: FileText
- Settings: Settings

Routes:
- Dashboard:     /dashboard
- Projects:      /projects
- Employees:     /employees
- Teams:         /teams
- My Dashboard:  /my/dashboard
- My Tasks:      /my/tasks
- My Notes:      /my/notes
- Settings:      /settings

Bottom user section:
- Avatar component (size='sm') + name (13px/500) + role (11px, gray-400)
- LogOut icon button (16px, gray-400, hover:text-red-500) right-aligned
- On logout: call POST /api/auth/logout, dispatch clearAuth(), push('/login')

Active detection:
- Use usePathname()
- /projects/[id] should keep "Projects" active
- /my/tasks/[id] should keep "My Tasks" active
- Match by startsWith for nested routes
```

### components/layout/Sidebar.tsx — mobile behavior
```
- On screens < 768px: sidebar hidden by default
- Toggle via uiSlice.sidebarOpen
- Overlay sidebar slides in from left
- Clicking outside closes it
```

---

## STEP 6 — Header component (final version)

### components/layout/Header.tsx

```
Design:
- Height: 56px
- Background: white
- Bottom border: 1px solid #F3F4F6
- Horizontal padding: px-8

Layout (left to right):
[Sidebar toggle btn] [Breadcrumb] ............. [Search bar] ............. [Bell] [User avatar+name]

Sidebar toggle:
- PanelLeft icon (lucide), 20px
- onClick: dispatch(toggleSidebar())
- Only visible on mobile or when sidebar is closed

Breadcrumb:
- Derives from current pathname
- e.g. /projects/123 → "Projects > Project Name"
- For now: just show the page name (e.g. "Dashboard", "Projects")
- Style: gray-400 parent → gray-900 current page (14px)

Search bar:
- Width: 360px, centered in header
- Background: gray-50, border: gray-200, rounded-lg
- Placeholder: "Search projects, people, teams..."
- Search icon (16px) left inside input
- Keyboard shortcut hint: "⌘K" badge right inside input
- onClick: opens search overlay (wire in Phase 8, for now just focus the input)

Right section:
- Bell icon (BellIcon, 20px, gray-500)
  Red dot badge (8px) top-right of bell (hardcoded for now)
- User avatar (Avatar component, size='sm')
- User name (13px/500) — from RTK auth.user.name
- ChevronDown (12px, gray-400)
- Clicking user area: shows simple dropdown with "Profile" + "Logout"
```

---

## STEP 7 — All app routes (stubs)

Create stub pages for every route so navigation works immediately.
Each stub shows a consistent "Coming Soon" state using the EmptyState component.

Create these files:

### app/(app)/dashboard/page.tsx
Full dashboard — built in STEP 8 below.

### app/(app)/projects/page.tsx
```typescript
// Stub — will be built in Phase 5
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { FolderKanban } from 'lucide-react'
export default function ProjectsPage() {
  return (
    <div>
      <PageHeader title="Projects" subtitle="All company projects" />
      <EmptyState
        icon={FolderKanban}
        title="Projects coming in Phase 5"
        description="The projects module will be built after employees and teams are set up."
      />
    </div>
  )
}
```

Create similar stubs for:
- app/(app)/projects/[id]/page.tsx
- app/(app)/employees/page.tsx
- app/(app)/employees/[id]/page.tsx
- app/(app)/teams/page.tsx
- app/(app)/teams/[id]/page.tsx
- app/(app)/my/dashboard/page.tsx
- app/(app)/my/tasks/page.tsx
- app/(app)/my/notes/page.tsx
- app/(app)/settings/page.tsx

Each stub must:
1. Import and use PageHeader with correct title
2. Show EmptyState with relevant icon and "coming in Phase X" message
3. Be fully TypeScript typed
4. Have correct metadata export

### app/not-found.tsx
```typescript
// 404 page
// OrgSphere logo centered
// "404 — Page not found" heading
// "The page you're looking for doesn't exist." subtext
// "Go to Dashboard" button → /dashboard
```

---

## STEP 8 — Dashboard page (real data)

### app/(app)/dashboard/page.tsx

Wire the dashboard to the real API stats endpoint built in STEP 1.

```typescript
'use client'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { StatCard } from '@/components/shared/StatCard'
import { FolderKanban, Users, UsersRound, CheckSquare } from 'lucide-react'
import api from '@/lib/axios'

interface DashboardStats {
  totalProjects: number
  totalEmployees: number
  activeTeams: number
  myOpenTasks: number
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data
    },
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8">

      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects}
          icon={FolderKanban}
          isLoading={isLoading}
          accentColor="indigo"
        />
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees}
          icon={Users}
          isLoading={isLoading}
          accentColor="teal"
        />
        <StatCard
          title="Active Teams"
          value={stats?.activeTeams}
          icon={UsersRound}
          isLoading={isLoading}
          accentColor="purple"
        />
        <StatCard
          title="My Open Tasks"
          value={stats?.myOpenTasks}
          icon={CheckSquare}
          isLoading={isLoading}
          accentColor="amber"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent projects placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
            <a href="/projects" className="text-sm text-indigo-600 hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {/* Placeholder rows — replaced with real data in Phase 5 */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-50 animate-pulse" />
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              Project data available after Phase 5
            </p>
          </div>
        </div>

        {/* Activity feed placeholder */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Activity Feed</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-200 mt-2 flex-shrink-0" />
                <div className="h-4 rounded bg-gray-50 animate-pulse flex-1" />
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              Activity feed available after Phase 7
            </p>
          </div>
        </div>

      </div>

      {/* Quick actions */}
      <div className="bg-indigo-600 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Ready to expand the ecosystem?</h2>
          <p className="text-indigo-200 text-sm mt-1">
            Streamline your workflow with quick entry points.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/projects"
            className="bg-white text-indigo-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            + Add Project
          </a>
          <a
            href="/employees"
            className="bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-400 transition-colors border border-indigo-400"
          >
            + Add Employee
          </a>
        </div>
      </div>

    </div>
  )
}
```

---

## STEP 9 — Global CSS tokens

### app/globals.css

Add these CSS variables after the Tailwind imports:

```css
:root {
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-light: #EEF2FF;
  --color-surface: #F9FAFB;
  --color-surface-card: #FFFFFF;
  --color-border: #F3F4F6;
  --color-border-strong: #E5E7EB;
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-modal: 0 12px 32px -4px rgba(21,28,39,0.12);
  --radius-card: 12px;
  --radius-btn: 8px;
}
```

---

## STEP 10 — types/index.ts

Create shared TypeScript types used across all frontend components:

### client/types/index.ts
```typescript
export type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  skills: string[]
  avatar_path: string | null
  manager_id: string | null
  is_active: boolean
  created_at: string
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planned' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

---

## ACCEPTANCE CRITERIA — Phase 2 is complete when:

- [ ] GET http://localhost:3000 shows the full landing page with all 5 sections
- [ ] "Login" button on landing page routes to /login
- [ ] After login, sidebar renders with all navigation items
- [ ] Active sidebar item highlights correctly for every route
- [ ] Navigating to /projects shows stub page (not 404)
- [ ] Navigating to /employees shows stub page (not 404)
- [ ] Navigating to /teams shows stub page (not 404)
- [ ] Navigating to /my/dashboard shows stub page (not 404)
- [ ] Navigating to /my/tasks shows stub page (not 404)
- [ ] Navigating to /my/notes shows stub page (not 404)
- [ ] Navigating to /settings shows stub page (not 404, admin only)
- [ ] Dashboard shows real employee count from PostgreSQL
- [ ] Dashboard greeting changes based on time of day
- [ ] Dashboard shows user's first name from RTK store
- [ ] Header breadcrumb shows current page name
- [ ] Logout from sidebar bottom clears session and redirects to /login
- [ ] 404 page shows for unknown routes
- [ ] Page refresh on any /app route restores session correctly
- [ ] TypeScript shows zero errors (tsc --noEmit)
- [ ] No console errors in browser
- [ ] Mobile: sidebar hidden by default, toggle button visible
