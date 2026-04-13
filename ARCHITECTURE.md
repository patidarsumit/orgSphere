# OrgSphere — Architecture Reference

> This is the single source of truth for all technical and design decisions.
> Read this file at the start of every development session before writing any code.

---

## 1. What is OrgSphere

An internal corporate collaboration and org-visibility platform. Employees can:
- See all projects in the company, who is working on them, and their status
- Browse the employee directory and org hierarchy
- Manage teams and team membership
- Use a personal workspace (tasks, notes, assigned projects)

Target users: Employees, Managers, Tech Leads, Admins — all within one company.
Deployment: Local only. No cloud. Everything runs on localhost.

---

## 2. Tech Stack — Locked

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | latest |
| Global UI State | Redux Toolkit (RTK) | latest |
| Server State | TanStack Query | v5 |
| Forms | React Hook Form + Zod resolvers | latest |
| Rich Text Editor | Tiptap | v2 |
| HTTP Client | Axios | latest |
| URL/Filter State | nuqs | latest |
| Icons | lucide-react | latest |

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express.js | latest |
| Language | TypeScript | strict mode |
| ORM | TypeORM | latest |
| Database | PostgreSQL | 16 (local) |
| Auth | JWT (jsonwebtoken) + bcrypt | latest |
| File Upload | Multer | latest |
| Validation | Zod | latest |
| Dev Server | ts-node-dev | latest |

### Shared
| Layer | Technology |
|---|---|
| Schema validation | Zod (shared /packages/schemas) |
| Package manager | npm workspaces |

---

## 3. Project Structure

```
orgsphere/
├── client/                     # Next.js 16 frontend
│   ├── app/
│   │   ├── (public)/           # Landing page, login (no sidebar)
│   │   │   ├── page.tsx        # Landing page
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (app)/              # Protected layout (with sidebar)
│   │   │   ├── layout.tsx      # Sidebar + header shell
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── my/
│   │   │       ├── dashboard/
│   │   │       ├── tasks/
│   │   │       └── notes/
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, Breadcrumb
│   │   ├── ui/                 # shadcn components
│   │   └── shared/             # Reusable app components
│   ├── store/
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts    # user, token, role
│   │       └── uiSlice.ts      # sidebar, modals, toasts
│   ├── lib/
│   │   ├── axios.ts            # Axios instance + interceptors
│   │   └── utils.ts
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # Frontend-only TypeScript types
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── entities/           # TypeORM entity classes
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── Team.ts
│   │   │   ├── Task.ts
│   │   │   ├── Note.ts
│   │   │   └── ActivityLog.ts
│   │   ├── routes/             # Express route definitions
│   │   ├── controllers/        # Request handler functions
│   │   ├── services/           # Business logic layer
│   │   ├── middleware/         # Auth, error, upload, validation
│   │   ├── migrations/         # TypeORM migration files
│   │   └── uploads/            # Local file storage (gitignored)
│   ├── app.ts                  # Express app setup
│   ├── data-source.ts          # TypeORM DataSource config
│   └── server.ts               # Entry point
│
└── packages/
    └── schemas/                # Shared Zod schemas (used by both)
        ├── auth.schema.ts
        ├── user.schema.ts
        ├── project.schema.ts
        ├── team.schema.ts
        ├── task.schema.ts
        └── note.schema.ts
```

---

## 4. Local Ports

| Service | Port |
|---|---|
| Next.js frontend | http://localhost:3000 |
| Express backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

---

## 5. Environment Variables

### server/.env
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orgsphere_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Server
PORT=4000
NODE_ENV=development

# File storage
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=5242880
```

### client/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 6. Database Entities

### users
```
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          varchar(255) NOT NULL
email         varchar(255) UNIQUE NOT NULL
password_hash varchar(255) NOT NULL
role          enum('admin','manager','tech_lead','employee') DEFAULT 'employee'
department    varchar(255)
skills        jsonb DEFAULT '[]'
avatar_path   varchar(500)
manager_id    uuid FK → users(id) NULLABLE
is_active     boolean DEFAULT true
created_at    timestamp DEFAULT now()
updated_at    timestamp DEFAULT now()
```

### projects
```
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          varchar(255) NOT NULL
description   text
status        enum('active','completed','on_hold','planned','archived') DEFAULT 'active'
tech_stack    jsonb DEFAULT '[]'
start_date    date
manager_id    uuid FK → users(id)
tech_lead_id  uuid FK → users(id)
team_id       uuid FK → teams(id)
created_at    timestamp DEFAULT now()
updated_at    timestamp DEFAULT now()
```

### teams
```
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          varchar(255) NOT NULL
description   text
created_by    uuid FK → users(id)
created_at    timestamp DEFAULT now()
updated_at    timestamp DEFAULT now()
```

### team_members (join table)
```
team_id   uuid FK → teams(id)
user_id   uuid FK → users(id)
PRIMARY KEY (team_id, user_id)
```

### project_members (join table)
```
project_id  uuid FK → projects(id)
user_id     uuid FK → users(id)
role        varchar(100)
PRIMARY KEY (project_id, user_id)
```

### tasks
```
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
title        varchar(255) NOT NULL
description  text
status       enum('todo','in_progress','review','done') DEFAULT 'todo'
priority     enum('low','medium','high') DEFAULT 'medium'
due_date     date
assigned_to  uuid FK → users(id)
project_id   uuid FK → projects(id) NULLABLE
created_by   uuid FK → users(id)
created_at   timestamp DEFAULT now()
updated_at   timestamp DEFAULT now()
```

### notes
```
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
title        varchar(255) NOT NULL
content      jsonb DEFAULT '{}'
tags         jsonb DEFAULT '[]'
user_id      uuid FK → users(id)
project_id   uuid FK → projects(id) NULLABLE
created_at   timestamp DEFAULT now()
updated_at   timestamp DEFAULT now()
```

### activity_logs
```
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
action       varchar(255) NOT NULL
entity_type  varchar(100) NOT NULL
entity_id    uuid NOT NULL
actor_id     uuid FK → users(id)
metadata     jsonb DEFAULT '{}'
created_at   timestamp DEFAULT now()
```

---

## 7. API Structure

All endpoints prefixed with `/api`

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Users / Employees
```
GET    /api/users              (paginated, searchable, filterable)
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/avatar   (file upload)
```

### Projects
```
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/members
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

### Teams
```
GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id
POST   /api/teams/:id/members
DELETE /api/teams/:id/members/:userId
```

### Tasks
```
GET    /api/tasks              (filter by assigned_to = me)
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Notes
```
GET    /api/notes              (filter by user_id = me)
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
```

### Activity
```
GET /api/activity              (global feed, paginated)
GET /api/activity/my           (current user only)
```

### Search
```
GET /api/search?q=query        (searches projects + users + teams)
```

---

## 8. Auth Architecture

- Access token: JWT, expires 15 minutes, stored in memory (RTK store)
- Refresh token: JWT, expires 7 days, stored in httpOnly cookie
- On 401 response: Axios interceptor auto-calls /api/auth/refresh
- On refresh fail: Clear store, redirect to /login
- Protected routes: middleware/auth.ts checks Authorization header Bearer token
- Role guard: middleware/role.ts checks user.role for admin-only routes

---

## 9. State Management Rules (CRITICAL)

### Redux Toolkit — UI state ONLY
```typescript
// authSlice: user object, access token, isAuthenticated
// uiSlice: sidebarOpen, activeModal, toasts, theme
// NOTHING ELSE in Redux
```

### TanStack Query — ALL server/API data
```typescript
// Projects, Employees, Teams, Tasks, Notes, Activity
// Never store API responses in Redux
// One source of truth: the server
```

### React Hook Form + Zod — ALL form state
```typescript
// Every form uses RHF + zod resolver
// Zod schema imported from /packages/schemas
```

### nuqs — URL / filter state
```typescript
// Search queries, status filters, pagination, view toggles
// Keeps filters shareable via URL
```

---

## 10. File Storage (Local)

- Upload handler: Multer middleware on Express
- Storage path: /server/src/uploads/ (gitignored)
- Served at: http://localhost:4000/uploads/filename
- DB stores: relative path string e.g. "uploads/avatars/uuid.jpg"
- Max size: 5MB per file
- Allowed types: image/jpeg, image/png, image/webp for avatars

---

## 11. Navigation Structure (LOCKED)

### Sidebar
```
ORGANIZATION
  Dashboard         /dashboard
  Projects          /projects
  Employees         /employees
  Teams             /teams

MY WORKSPACE
  My Dashboard      /my/dashboard
  My Tasks          /my/tasks
  My Notes          /my/notes

ADMIN (admin role only)
  Settings          /settings
```

### Top Header
- Left: breadcrumb (current page)
- Center: global search bar
- Right: notification bell + user avatar + name

---

## 12. Design System (from Stitch)

- Primary: Indigo 600 (#4F46E5)
- Background: #F9FAFB (Gray 50)
- Card surface: #FFFFFF
- Primary text: #111827 (Gray 900)
- Secondary text: #6B7280 (Gray 500)
- Border: #F3F4F6 (Gray 100) — use sparingly
- Font: Inter
- Border radius cards: 12px
- Border radius buttons: 8px
- Shadow (modals only): 0 12px 32px -4px rgba(21,28,39,0.08)

### Status colors
- Active / Done: #22C55E (Green 500)
- In Progress: #F59E0B (Amber 500)
- Blocked / Error: #EF4444 (Red 500)
- Todo / Neutral: #9CA3AF (Gray 400)
- Planned: #3B82F6 (Blue 500)

---

## 13. Build Phases

| Phase | Feature | Status |
|---|---|---|
| 1 | Monorepo scaffold + Auth | Todo |
| 2 | App shell + navigation + landing | Todo |
| 3 | Employee module | Todo |
| 4 | Teams module | Todo |
| 5 | Projects module | Todo |
| 6 | My Workspace (tasks + notes) | Todo |
| 7 | Dashboard (live data) + activity feed | Todo |
| 8 | Global search + Settings | Todo |

### Phase completion rule
A phase is DONE only when:
1. Backend API endpoints work and return real data
2. Frontend is wired to the real API (no hardcoded mock data)
3. Feature is testable end-to-end on localhost

---

## 14. Key Rules for AI Coding Sessions

1. Always read this file before starting any task
2. Never put database queries in Next.js components or route handlers
3. Never store API response data in Redux — use TanStack Query
4. All forms must use React Hook Form + Zod resolver
5. Zod schemas always imported from /packages/schemas, never redefined inline
6. All file uploads go through Multer on Express, stored in /server/src/uploads/
7. TypeScript strict mode — no `any` types
8. Every Express route must go through auth middleware unless explicitly public
9. Activity log entry must be created for every create/update/delete operation
10. Build backend API first, then wire frontend — never build UI with fake data past Phase 2
