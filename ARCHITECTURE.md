# OrgSphere — Current Architecture Reference

> This document describes the architecture that is implemented in `/home/shrini/sumit/orgSphere` today.
> Read this before making structural changes.

---

## 1. Product Overview

OrgSphere is an internal collaboration and org-visibility platform with a public-facing marketing and blog layer.

It currently supports:
- Public landing page and editorial blog
- Authenticated org dashboard
- Employee directory and profiles
- Teams and team detail views
- Projects and project detail views
- Personal workspace: dashboard, tasks, notes
- Activity feed and notifications
- Settings and role management
- Internal blog/content workspace at `/content/blog`

Two blog surfaces exist intentionally:
- Public blog: reader-facing content at `/blog`
- Internal content workspace: editorial management at `/content/blog`

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Client UI state | Redux Toolkit |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Rich text editor | Tiptap |
| Routing/query state | Next App Router + `nuqs` |
| HTTP client | Axios |
| Icons | `lucide-react` |
| Notifications | `sonner` |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript |
| ORM | TypeORM |
| Database | PostgreSQL |
| Auth | JWT access token + refresh token cookie |
| Validation | Zod via shared schemas |
| Uploads | Multer |

### Monorepo
| Layer | Technology |
|---|---|
| Package manager | npm workspaces |
| Shared validation package | `packages/schemas` |

---

## 3. Workspace Structure

```text
orgSphere/
├── client/                  # Next.js application
├── server/                  # Express + TypeORM API
├── packages/schemas/        # Shared Zod schemas
├── stitch-exports/          # Pulled prototype/export assets
├── ARCHITECTURE.md
├── PERMISSIONS.md
└── PHASE*.md                # Delivery/implementation history
```

### Root scripts

```bash
npm run dev
npm run dev:client
npm run dev:server
npm run typecheck
```

---

## 4. Frontend Architecture

### 4.1 App Router structure

```text
client/app/
├── layout.tsx
├── not-found.tsx
├── error/page.tsx
├── (public)/
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx
│   └── blog/
│       ├── page.tsx              # Blog index
│       └── [slug]/page.tsx       # Public article
└── (app)/
    ├── layout.tsx                # Protected shell
    ├── dashboard/page.tsx
    ├── employees/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── teams/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── projects/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── my/
    │   ├── dashboard/page.tsx
    │   ├── tasks/page.tsx
    │   └── notes/page.tsx
    ├── settings/page.tsx
    └── content/
        └── blog/page.tsx         # Internal editorial workspace
```

### 4.2 Frontend folders

```text
client/
├── app/
├── components/
│   ├── activity/
│   ├── blog/
│   ├── employees/
│   ├── layout/
│   ├── notes/
│   ├── projects/
│   ├── public/
│   ├── search/
│   ├── shared/
│   ├── tasks/
│   └── teams/
├── hooks/                     # TanStack Query hooks + helpers
├── lib/                       # axios client, toast utils, helpers
├── public/
├── store/
│   └── slices/
├── types/
└── app/providers.tsx
```

### 4.3 State ownership

- Redux Toolkit:
  - auth identity/session state
  - lightweight UI state
- TanStack Query:
  - API-backed resources and mutations
  - cache invalidation after create/update/delete
- React Hook Form + Zod:
  - forms and client-side validation
- `nuqs`:
  - table filters, pagination, search query state

Rule:
- API data lives in Query, not Redux.

### 4.4 Shell model

Public routes use the `(public)` layout style:
- landing
- login
- public blog

Protected routes use `(app)`:
- persistent sidebar
- top header
- route guards based on auth state

The app shell currently includes:
- Organization section
- My Workspace section
- Other section with Blog
- Admin section with Settings

---

## 5. Backend Architecture

### 5.1 Server structure

```text
server/src/
├── app.ts
├── server.ts
├── data-source.ts
├── config/
├── controllers/
├── entities/
├── middleware/
├── migrations/
├── permissions/
├── routes/
├── seeds/
├── services/
├── uploads/
└── utils/
```

### 5.2 Layering

The backend follows a simple layered structure:

- routes:
  - Express route registration
  - auth/validation/permission middleware composition
- controllers:
  - request/response orchestration
  - HTTP status handling
- services:
  - business logic and database access
- middleware:
  - auth
  - validation
  - permission guards
  - upload handling
- entities:
  - TypeORM models

### 5.3 Registered route groups

Mounted in `server/src/app.ts`:

```text
/api/auth
/api/activity
/api/dashboard
/api/employees
/api/projects
/api/search
/api/settings
/api/teams
/api/tasks
/api/notes
/api/posts
```

---

## 6. Shared Schemas

Shared Zod schemas live in `packages/schemas` and are imported by both client and server.

Current package contents:

```text
packages/schemas/
├── auth.schema.ts
├── employee.schema.ts
├── note.schema.ts
├── post.schema.ts
├── project.schema.ts
├── task.schema.ts
├── team.schema.ts
├── user.schema.ts
└── index.ts
```

Rule:
- validation contracts should be defined here whenever shared by client and server.

---

## 7. Data Model

### Core entities

Implemented TypeORM entities:

```text
User
Team
Project
ProjectMember
Task
Note
Post
ActivityLog
```

### Domain summary

- `User`
  - employee identity, role, manager linkage, profile data
- `Team`
  - grouped employees with ownership and membership
- `Project`
  - delivery object with manager, tech lead, status, tech stack
- `ProjectMember`
  - project membership join model
- `Task`
  - personal/project work items
- `Note`
  - personal/project notes
- `Post`
  - editorial/public blog content with slug and publish state
- `ActivityLog`
  - cross-feature audit/activity feed events

### Current blog model

The `Post` entity supports the current blog architecture:
- public retrieval by slug
- internal listing for the content workspace
- draft/published/archived lifecycle
- author relation
- tags
- publish timestamps
- view tracking

---

## 8. Authentication and Session Model

Current auth model:

- login returns authenticated user context
- access token is used for API authorization
- refresh token is stored in an `httpOnly` cookie
- Axios refresh flow retries expired sessions
- failed refresh clears auth and returns user to public flow

Important frontend pieces:
- `client/store/slices/authSlice.ts`
- `client/components/shared/AuthBootstrap.tsx`
- `client/lib/axios.ts`

Important backend pieces:
- `server/src/controllers/auth.controller.ts`
- `server/src/middleware/auth.ts`
- `server/src/routes/auth.routes.ts`

Protected routes are enforced in two places:
- frontend layout/navigation gating
- backend middleware on API routes

---

## 9. Permission Architecture

Permissions are not hardcoded only in UI. The backend is the source of truth.

Core files:
- `server/src/permissions/index.ts`
- `server/src/middleware/permissions.ts`
- `client/hooks/usePermissions.ts`
- `PERMISSIONS.md`

### Role model in use

Current roles in the system include:
- `admin`
- `manager`
- `tech_lead`
- `employee`
- `hr`
- `viewer`

### Permission style

OrgSphere uses action-based permissions such as:
- employee create/edit/deactivate
- project create/manage/delete
- team create/manage/delete
- settings access
- post access/publish

### Blog-specific permissions

Current blog/content permissions:
- `posts.access`
- `posts.publish`

Current behavior:
- users with `posts.access` can open the internal content workspace
- users with `posts.publish` can publish or unpublish
- authors can manage their own posts
- admins can manage any post

The current internal post listing is intentionally scoped:
- publishers see all posts
- non-publishers see:
  - their own posts
  - published posts

This prevents general authors from browsing everyone else’s drafts.

---

## 10. Public vs Internal Blog Architecture

This is an important current-state distinction.

### Public blog

Routes:

```text
/blog
/blog/[slug]
```

Purpose:
- marketing/editorial surface
- public content discovery
- stitched visual design adapted into the app

### Internal blog workspace

Route:

```text
/content/blog
```

Purpose:
- create and edit posts
- manage publish lifecycle
- internal editorial workflow

Why it lives here:
- blog management is content work, not platform configuration
- `Settings` remains focused on admin/system concerns

---

## 11. API Surface

All endpoints are prefixed with `/api`.

### Auth
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Employees
```text
GET    /api/employees
GET    /api/employees/skills
GET    /api/employees/:id
POST   /api/employees
PUT    /api/employees/:id
POST   /api/employees/:id/avatar
DELETE /api/employees/:id
```

### Projects
```text
GET    /api/projects
GET    /api/projects/recent
GET    /api/projects/user/:userId
GET    /api/projects/team/:teamId
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
PUT    /api/projects/:id/members/:userId
DELETE /api/projects/:id/members/:userId
```

### Teams
```text
GET    /api/teams
GET    /api/teams/user/:userId
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
DELETE /api/teams/:id
POST   /api/teams/:id/members
DELETE /api/teams/:id/members/:userId
```

### Tasks
```text
GET    /api/tasks
GET    /api/tasks/today
GET    /api/tasks/project/:projectId
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

### Notes
```text
GET    /api/notes
GET    /api/notes/recent
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
```

### Activity
```text
GET  /api/activity
GET  /api/activity/recent
GET  /api/activity/unread-count
POST /api/activity/mark-read
GET  /api/activity/:entity_type/:entity_id
```

### Search
```text
GET /api/search
```

### Dashboard
```text
GET /api/dashboard/stats
```

### Settings
```text
GET /api/settings/overview
GET /api/settings/roles
PUT /api/settings/roles/:userId
PUT /api/settings/profile
PUT /api/settings/password
```

### Posts
```text
GET    /api/posts/public
GET    /api/posts/public/featured
GET    /api/posts/public/tags
GET    /api/posts/public/:slug

GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/unpublish
```

---

## 12. UI Composition and Reuse

The app is organized around reusable domain components rather than a single generic UI kit.

Examples:
- `components/layout`
  - sidebar, header, breadcrumb
- `components/shared`
  - avatar, badges, dialogs, empty states
- `components/projects`
  - project form and project-specific presentation
- `components/employees`
  - employee form/table/constants
- `components/blog`
  - editorial management table, post editor modal, blog utilities
- `components/public`
  - landing/blog navigation and footer

Current UI direction:
- Tailwind-only styling
- soft surfaces over hard borders
- rounded cards
- light, layered public marketing pages
- stronger data-dense layouts inside the authenticated app

---

## 13. Local Development

### Ports

| Service | Port |
|---|---|
| Next.js client | `http://localhost:3000` |
| Express API | `http://localhost:4000` |
| PostgreSQL | `localhost:5432` |

### Typical run flow

```bash
npm install
npm run dev
```

### Useful server scripts

```bash
npm run seed --workspace=server
npm run seed:teams --workspace=server
npm run seed:projects --workspace=server
npm run seed:workspace --workspace=server
npm run seed:activity --workspace=server
npm run seed:blog --workspace=server
npm run migration:run --workspace=server
```

---

## 14. Current Navigation Model

### Public

```text
/                  Landing page
/login             Sign in
/blog              Blog index
/blog/[slug]       Public article
```

### Authenticated app

```text
/dashboard
/employees
/employees/[id]
/teams
/teams/[id]
/projects
/projects/[id]
/my/dashboard
/my/tasks
/my/notes
/content/blog
/settings
```

### Sidebar intent

- Organization:
  - Dashboard
  - Projects
  - Employees
  - Teams
- My Workspace:
  - My Dashboard
  - My Tasks
  - My Notes
- Other:
  - Blog
- Admin:
  - Settings

---

## 15. Architecture Rules

1. Keep the client as a Next.js UI application, not a second backend.
2. Keep database access in the Express/TypeORM server layer.
3. Use TanStack Query for API data and Redux for auth/UI only.
4. Prefer shared Zod schemas from `packages/schemas` when contracts are shared.
5. Enforce permissions on the backend first, then mirror them in the frontend for UX.
6. Treat public blog and internal content workspace as separate surfaces.
7. Keep Settings focused on configuration and administration, not editorial work.
8. New list/detail modules should follow the current domain-component structure, not ad hoc page-local sprawl.
9. Maintain activity logging for create/update/delete workflows where the feature already participates in the activity feed.
10. Update this file when architectural decisions materially change.
