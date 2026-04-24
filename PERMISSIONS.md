# OrgSphere Permissions

This document describes the permission system currently implemented in `/home/shrini/sumit/orgSphere`.

OrgSphere uses role-based access control with ownership checks.

Important rule:
- the backend is the source of truth
- frontend permission checks only shape UX by hiding or showing actions

---

## 1. Roles

Current roles in the system:

1. `admin`
2. `hr`
3. `manager`
4. `tech_lead`
5. `employee`
6. `viewer`

Notes:
- these roles are not treated as a strict business hierarchy for every action
- `hr` is lateral rather than “above” manager for most non-employee workflows
- ownership checks are layered on top of role permissions for teams, projects, tasks, notes, and posts

Backend role ordering used for utility checks:

```text
viewer < employee < tech_lead < manager < hr < admin
```

That ordering exists in code, but most real access decisions use explicit action mappings instead of hierarchy alone.

---

## 2. Permission Source Files

Backend:
- [server/src/permissions/index.ts](/home/shrini/sumit/orgSphere/server/src/permissions/index.ts)
- [server/src/middleware/permissions.ts](/home/shrini/sumit/orgSphere/server/src/middleware/permissions.ts)

Frontend:
- [client/hooks/usePermissions.ts](/home/shrini/sumit/orgSphere/client/hooks/usePermissions.ts)

Related docs:
- [ARCHITECTURE.md](/home/shrini/sumit/orgSphere/ARCHITECTURE.md)

---

## 3. Backend Permission Actions

The backend currently defines these action-based permissions:

```text
posts.access
posts.publish
employees.create
employees.edit_any
employees.edit_own
employees.deactivate
teams.create
teams.manage
teams.delete
projects.create
projects.manage
projects.delete
tasks.manage_any
notes.manage_own
settings.access
```

Current role mapping:

| Action | Allowed roles |
|---|---|
| `posts.access` | `admin`, `hr`, `manager`, `tech_lead`, `employee` |
| `posts.publish` | `admin`, `manager`, `tech_lead` |
| `employees.create` | `admin`, `manager`, `hr` |
| `employees.edit_any` | `admin`, `hr` |
| `employees.edit_own` | `admin`, `hr`, `manager`, `tech_lead`, `employee`, `viewer` |
| `employees.deactivate` | `admin`, `hr` |
| `teams.create` | `admin`, `manager` |
| `teams.manage` | `admin` |
| `teams.delete` | `admin` |
| `projects.create` | `admin`, `manager` |
| `projects.manage` | `admin` |
| `projects.delete` | `admin` |
| `tasks.manage_any` | `admin` |
| `notes.manage_own` | `admin`, `hr`, `manager`, `tech_lead`, `employee`, `viewer` |
| `settings.access` | `admin` |

Important:
- some actions are broader in practice because middleware adds ownership-based allowances
- for example, `teams.manage` and `projects.manage` are not admin-only in behavior once ownership checks are applied

---

## 4. Effective Access Summary

This table describes current effective behavior, not just raw action mappings.

| Area | Admin | HR | Manager | Tech Lead | Employee | Viewer |
|---|---|---|---|---|---|---|
| View employees | Yes | Yes | Yes | Yes | Yes | Yes |
| Create employees | Yes | Yes | Yes | No | No | No |
| Edit any employee | Yes | Yes | No | No | No | No |
| Edit own profile | Yes | Yes | Yes | Yes | Yes | Yes |
| Deactivate employees | Yes | Yes, except admin accounts | No | No | No | No |
| View teams | Yes | Yes | Yes | Yes | Yes | Yes |
| Create teams | Yes | No | Yes | No | No | No |
| Manage team | Yes | Creator only | Creator only | Creator only | Creator only | Creator only |
| Delete teams | Yes | No | No | No | No | No |
| View projects | Yes | Yes | Yes | Yes | Yes | Yes |
| Create projects | Yes | No | Yes | No | No | No |
| Manage project | Yes | No | Assigned manager only | Assigned tech lead only | No | No |
| Delete projects | Yes | No | No | No | No | No |
| View own tasks | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage own tasks | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage any task | Yes | No | No | No | No | No |
| View/manage own notes | Yes | Yes | Yes | Yes | Yes | Yes |
| View/manage others' notes | No | No | No | No | No | No |
| View activity feed | Yes | Yes | Yes | Yes | Yes | Yes |
| Access settings page | Yes | No | No | No | No | No |
| Access internal blog workspace | Yes | Yes | Yes | Yes | Yes | No |
| Publish/unpublish blog posts | Yes | No | Yes | Yes | No | No |

---

## 5. Ownership Rules

### Employees

- everyone can view employee data
- admins can edit any employee
- HR can edit any employee
- authenticated users can edit their own profile
- self-edit is limited by service/controller logic to safe profile fields
- admins and HR can deactivate employees
- HR cannot deactivate admin accounts
- users cannot deactivate themselves

### Teams

- everyone can view teams
- admins and managers can create teams
- a team can be managed by:
  - admin
  - the user who created the team
- only admins can delete teams

### Projects

- everyone can view projects
- admins and managers can create projects
- a project can be managed by:
  - admin
  - assigned project manager
  - assigned tech lead
- only admins can delete projects

### Tasks

- authenticated users can create tasks
- users can manage tasks assigned to themselves
- admins can manage any task

### Notes

- notes are private to their owner
- users can only view and manage their own notes
- admins do not get default access to other users’ notes

### Posts / Blog

- users with `posts.access` can access the internal content workspace
- admins can manage any post
- non-admin users can manage only their own posts
- users with `posts.publish` can publish or unpublish posts

Internal post listing is intentionally scoped:
- publishers see all posts
- non-publishers see:
  - their own posts
  - published posts

That means ordinary authors cannot browse all unpublished drafts across the organization.

---

## 6. Current Blog Permission Model

OrgSphere now separates public reading from internal editorial management.

### Public blog

Routes:

```text
/blog
/blog/[slug]
```

Access:
- public
- no login required

### Internal content workspace

Route:

```text
/content/blog
```

Access:
- requires login
- requires `posts.access`

Editorial model:
- many roles can draft/create
- fewer roles can publish

Current behavior:
- `employee` can author but not publish
- `hr` can access blog workspace but not publish
- `manager` can author and publish
- `tech_lead` can author and publish
- `admin` can author, publish, and manage all posts
- `viewer` cannot access internal blog tooling

This is why blog management now lives outside `Settings`.

---

## 7. Middleware Behavior

The backend uses route-level and resource-level checks.

### Generic guards

- `requirePermission(action)`
- `requireAnyRole(...roles)`
- `adminOnly`

### Resource-aware guards

- `canEditEmployee`
  - any employee with `employees.edit_any`
  - or the user editing their own profile
- `canDeactivateEmployee`
  - requires `employees.deactivate`
  - blocks self-deactivation
  - blocks HR from deactivating admins
- `canManageTeam`
  - admin
  - or team creator
- `canManageProject`
  - admin
  - or assigned project manager
  - or assigned tech lead
- `canManageTask`
  - admin via `tasks.manage_any`
  - or assigned user
- `canManageNote`
  - note owner only
- `canAccessPosts`
  - requires `posts.access`
- `canPublishPosts`
  - requires `posts.publish`
- `canManagePost`
  - admin
  - or post author

This is where most of the effective permission behavior comes from.

---

## 8. Route Enforcement

### Employees

[server/src/routes/employee.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/employee.routes.ts)

- authenticated for all routes
- create uses `canCreateEmployee`
- update/avatar use `canEditEmployee`
- delete uses `canDeactivateEmployee`

### Teams

[server/src/routes/team.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/team.routes.ts)

- authenticated for all routes
- create uses `canCreateTeam`
- update/member changes use `canManageTeam`
- delete uses `adminOnly`

### Projects

[server/src/routes/project.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/project.routes.ts)

- authenticated for all routes
- create uses `canCreateProject`
- update/member changes use `canManageProject`
- delete uses `adminOnly`

### Tasks

[server/src/routes/task.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/task.routes.ts)

- authenticated for all routes
- item-level read/update/delete use `canManageTask`

### Notes

[server/src/routes/note.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/note.routes.ts)

- authenticated for all routes
- item-level read/update/delete use `canManageNote`

### Settings

[server/src/routes/settings.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/settings.routes.ts)

- authenticated for all routes
- overview and role-management endpoints require `settings.access`
- profile/password endpoints are authenticated but not admin-only

### Posts

[server/src/routes/post.routes.ts](/home/shrini/sumit/orgSphere/server/src/routes/post.routes.ts)

Public:
- `GET /api/posts/public`
- `GET /api/posts/public/featured`
- `GET /api/posts/public/tags`
- `GET /api/posts/public/:slug`

Internal:
- route group requires auth + `canAccessPosts`
- `GET /api/posts` lists internal workspace data
- `GET /api/posts/:id` requires `canManagePost`
- `POST /api/posts` allows authenticated users with `posts.access`
- `PUT /api/posts/:id` requires `canManagePost`
- `DELETE /api/posts/:id` requires `canManagePost`
- publish/unpublish require `canPublishPosts`

---

## 9. Frontend Permission Model

The frontend mirrors the backend closely for UX purposes.

Primary file:
- [client/hooks/usePermissions.ts](/home/shrini/sumit/orgSphere/client/hooks/usePermissions.ts)

The hook currently exposes:
- role flags such as `isAdmin`, `isHr`, `isManager`, `isTechLead`
- `can.*` checks for:
  - employee create/edit/deactivate
  - team create/manage/delete
  - project create/manage/delete
  - task manage
  - blog access/publish
  - settings access

Important:
- frontend checks should prevent bad UX, not enforce security
- if a UI action is shown by mistake, the API must still return `403`

Current frontend blog checks:
- `can.accessBlog`
- `can.publishBlog`

---

## 10. Known Nuance

There is a small but intentional distinction between:
- backend raw permission maps
- middleware ownership checks
- frontend convenience checks

Example:
- `projects.manage` in the raw permission map only lists `admin`
- but `canManageProject` extends effective access to assigned managers and tech leads

So when reviewing access behavior, always prefer:
1. route middleware behavior
2. service/controller ownership checks
3. frontend rendering logic
4. raw role matrix alone

---

## 11. Rules for Future Changes

1. Add or change permissions in the backend first.
2. Reflect the same behavior in `usePermissions()` for UX.
3. Prefer action-based permissions over hardcoding page access by role name.
4. Use ownership-aware guards for resource-specific actions.
5. Keep public blog access separate from internal content permissions.
6. Do not move editorial workflows back into `Settings`.
7. Update this file whenever permission behavior materially changes.
