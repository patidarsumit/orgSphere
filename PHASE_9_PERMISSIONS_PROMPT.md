# OrgSphere — Permissions Implementation Prompt
# Professional RBAC + Ownership + Resource-level access control
# Run this as a dedicated session — before or after Phase 8
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are adding professional permission enforcement to OrgSphere.
All phases (1–8) are complete. This prompt retrofits proper RBAC across the entire app.

Read ARCHITECTURE.md at the project root before writing any code.

The permission system has two layers:
1. Backend: middleware that enforces permissions on every API route
2. Frontend: hooks + components that gate UI based on permissions

---

## PERMISSION RULES (source of truth)

### Role hierarchy (highest to lowest):
admin > manager > tech_lead > employee

### Access rules:

EMPLOYEES:
- view_any:        all roles
- create:          admin, manager
- edit_any:        admin only
- edit_own:        all roles (own profile)
- deactivate:      admin only

TEAMS:
- view_any:        all roles
- create:          admin, manager
- edit_own:        admin OR team.created_by === user.id
- manage_members:  admin OR team.created_by === user.id
- delete:          admin only

PROJECTS:
- view_any:        all roles
- create:          admin, manager
- edit_own:        admin OR project.manager_id === user.id OR project.tech_lead_id === user.id
- manage_members:  admin OR project.manager_id === user.id OR project.tech_lead_id === user.id
- delete:          admin only

TASKS:
- view_own:        all roles (own tasks only — API already scoped to user)
- create:          all roles (assigned to self only)
- edit_own:        all roles (own tasks only)
- edit_any:        admin only

NOTES:
- view_own:        all roles (own notes only — API already scoped to user)
- create:          all roles
- edit_own:        all roles (own notes only)
- view_others:     nobody (notes are strictly private)

SETTINGS:
- access:          admin only

ACTIVITY:
- view_global:     all roles
- view_entity:     all roles

---

## STEP 1 — Backend: Permission constants

### server/src/permissions/index.ts
```typescript
export type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

// Role hierarchy — higher index = more permissions
export const ROLE_HIERARCHY: UserRole[] = [
  'employee', 'tech_lead', 'manager', 'admin'
]

// Check if a role meets a minimum required role
export const hasMinRole = (userRole: UserRole, minRole: UserRole): boolean => {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)
}

// Permission definitions — centralised single source of truth
export const PERMISSIONS = {
  employee: {
    create:     ['admin', 'manager'] as UserRole[],
    edit_any:   ['admin'] as UserRole[],
    edit_own:   ['admin', 'manager', 'tech_lead', 'employee'] as UserRole[],
    deactivate: ['admin'] as UserRole[],
  },
  team: {
    create:         ['admin', 'manager'] as UserRole[],
    delete:         ['admin'] as UserRole[],
    // edit_own and manage_members checked via ownership (see middleware)
  },
  project: {
    create:  ['admin', 'manager'] as UserRole[],
    delete:  ['admin'] as UserRole[],
    // edit_own and manage_members checked via ownership (see middleware)
  },
  task: {
    edit_any: ['admin'] as UserRole[],
    // edit_own checked via ownership
  },
  settings: {
    access: ['admin'] as UserRole[],
  },
}

export const can = (userRole: UserRole, action: UserRole[]): boolean => {
  return action.includes(userRole)
}
```

---

## STEP 2 — Backend: Permission middleware factory

### server/src/middleware/permissions.ts
```typescript
import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { PERMISSIONS, can, UserRole } from '../permissions'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { Task } from '../entities/Task'
import { Note } from '../entities/Note'

// ─── Role-based guards ─────────────────────────────────────────────────────

// Require a minimum role level
export const requireRole = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }
    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Insufficient permissions' })
      return
    }
    next()
  }

// Admin only shorthand
export const adminOnly = requireRole('admin')

// Admin or manager
export const managerOrAbove = requireRole('admin', 'manager')

// ─── Ownership guards ──────────────────────────────────────────────────────

// Can edit employee: admin can edit any, others can only edit themselves
export const canEditEmployee = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }

  const targetId = req.params.id
  const role = req.user.role as UserRole

  // Admin can edit anyone
  if (role === 'admin') { next(); return }

  // Others can only edit themselves
  if (targetId === req.user.id) { next(); return }

  res.status(403).json({ message: 'You can only edit your own profile' })
}

// Can manage project: admin, or the assigned manager, or the assigned tech lead
export const canManageProject = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }

  const role = req.user.role as UserRole
  if (role === 'admin') { next(); return }

  const project = await AppDataSource.getRepository(Project)
    .findOne({ where: { id: req.params.id } })

  if (!project) { res.status(404).json({ message: 'Project not found' }); return }

  const isManager  = project.manager_id  === req.user.id
  const isTechLead = project.tech_lead_id === req.user.id

  if (isManager || isTechLead) { next(); return }

  res.status(403).json({
    message: 'Only the project manager or tech lead can perform this action'
  })
}

// Can create project: admin or manager
export const canCreateProject = requireRole('admin', 'manager')

// Can manage team: admin or the team creator
export const canManageTeam = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }

  const role = req.user.role as UserRole
  if (role === 'admin') { next(); return }

  const team = await AppDataSource.getRepository(Team)
    .findOne({ where: { id: req.params.id } })

  if (!team) { res.status(404).json({ message: 'Team not found' }); return }

  if (team.created_by === req.user.id) { next(); return }

  res.status(403).json({
    message: 'Only the team creator or admin can perform this action'
  })
}

// Can manage own task: admin can touch any task, others only their own
export const canManageTask = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }

  const role = req.user.role as UserRole
  if (role === 'admin') { next(); return }

  const task = await AppDataSource.getRepository(Task)
    .findOne({ where: { id: req.params.id } })

  if (!task) { res.status(404).json({ message: 'Task not found' }); return }

  if (task.assigned_to === req.user.id) { next(); return }

  res.status(403).json({ message: 'You can only manage your own tasks' })
}

// Can manage own note: notes are always private — only owner can touch them
export const canManageNote = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return }

  // Admin can also access notes for moderation purposes
  const role = req.user.role as UserRole
  if (role === 'admin') { next(); return }

  const note = await AppDataSource.getRepository(Note)
    .findOne({ where: { id: req.params.id } })

  if (!note) { res.status(404).json({ message: 'Note not found' }); return }

  if (note.user_id === req.user.id) { next(); return }

  res.status(403).json({ message: 'You can only manage your own notes' })
}
```

---

## STEP 3 — Backend: Apply permissions to all routes

### Update server/src/routes/employee.routes.ts
```typescript
import {
  adminOnly, managerOrAbove, canEditEmployee
} from '../middleware/permissions'

router.get('/',          getAll)              // all authenticated users
router.get('/skills',    getSkills)           // all authenticated users
router.get('/:id',       getOne)              // all authenticated users
router.post('/',         managerOrAbove, validate(createEmployeeSchema), create)
router.put('/:id',       canEditEmployee, validate(updateEmployeeSchema), update)
router.post('/:id/avatar', canEditEmployee, avatarUpload.single('avatar'), uploadAvatar)
router.delete('/:id',    adminOnly, remove)
```

### Update server/src/routes/team.routes.ts
```typescript
import {
  managerOrAbove, adminOnly, canManageTeam
} from '../middleware/permissions'

router.get('/',                 getAll)           // all
router.get('/user/:userId',     getByUser)        // all
router.get('/:id',              getOne)           // all
router.post('/',                managerOrAbove, validate(createTeamSchema), create)
router.put('/:id',              canManageTeam, validate(updateTeamSchema), update)
router.delete('/:id',           adminOnly, remove)
router.post('/:id/members',     canManageTeam, validate(addTeamMemberSchema), addMember)
router.delete('/:id/members/:userId', canManageTeam, removeMember)
```

### Update server/src/routes/project.routes.ts
```typescript
import {
  canCreateProject, canManageProject, adminOnly
} from '../middleware/permissions'

router.get('/recent',           getRecent)        // all
router.get('/user/:userId',     getByUser)        // all
router.get('/team/:teamId',     getByTeam)        // all
router.get('/',                 getAll)           // all
router.get('/:id',              getOne)           // all
router.post('/',                canCreateProject, validate(createProjectSchema), create)
router.put('/:id',              canManageProject, validate(updateProjectSchema), update)
router.delete('/:id',           adminOnly, remove)
router.post('/:id/members',     canManageProject, validate(addProjectMemberSchema), addMember)
router.delete('/:id/members/:userId', canManageProject, removeMember)
```

### Update server/src/routes/task.routes.ts
```typescript
import { canManageTask } from '../middleware/permissions'

router.get('/',        getMyTasks)              // scoped to user in service
router.get('/:id',     canManageTask, getOne)
router.post('/',       validate(createTaskSchema), create)
router.put('/:id',     canManageTask, validate(updateTaskSchema), update)
router.delete('/:id',  canManageTask, remove)
```

### Update server/src/routes/note.routes.ts
```typescript
import { canManageNote } from '../middleware/permissions'

router.get('/',        getMyNotes)              // scoped to user in service
router.get('/:id',     canManageNote, getOne)
router.post('/',       validate(createNoteSchema), create)
router.put('/:id',     canManageNote, validate(updateNoteSchema), update)
router.delete('/:id',  canManageNote, remove)
```

### Update server/src/routes/settings.routes.ts
```typescript
import { adminOnly } from '../middleware/permissions'

router.get('/overview',         adminOnly, getOverview)
router.get('/roles',            adminOnly, getRoles)
router.put('/roles/:userId',    adminOnly, updateRole)
router.put('/profile',          updateProfile)   // any authenticated user
router.put('/password',         changePassword)  // any authenticated user
```

---

## STEP 4 — Frontend: Permission hook

### client/hooks/usePermissions.ts

This is the single hook all frontend components use to check permissions.
It reads from the RTK auth store and computes what the current user can do.

```typescript
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { User, Project, Team } from '@/types'

type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

const ROLE_HIERARCHY: UserRole[] = ['employee', 'tech_lead', 'manager', 'admin']

const hasMinRole = (userRole: UserRole, minRole: UserRole): boolean =>
  ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user)

  if (!user) {
    return {
      isAdmin: false,
      isManager: false,
      isTechLead: false,
      can: {
        createEmployee: false,
        editEmployee: (_targetId: string) => false,
        deactivateEmployee: false,
        createTeam: false,
        manageTeam: (_team: Pick<Team, 'created_by'>) => false,
        deleteTeam: false,
        createProject: false,
        manageProject: (_project: Pick<Project, 'manager_id' | 'tech_lead_id'>) => false,
        deleteProject: false,
        manageTask: (_assignedTo: string) => false,
        accessSettings: false,
      },
    }
  }

  const role = user.role as UserRole
  const isAdmin    = role === 'admin'
  const isManager  = hasMinRole(role, 'manager')
  const isTechLead = hasMinRole(role, 'tech_lead')

  return {
    isAdmin,
    isManager,
    isTechLead,
    role,

    can: {
      // Employees
      createEmployee:     isAdmin || isManager,
      editEmployee:       (targetId: string) => isAdmin || targetId === user.id,
      deactivateEmployee: isAdmin,

      // Teams
      createTeam:  isAdmin || isManager,
      manageTeam:  (team: Pick<Team, 'created_by'>) =>
                     isAdmin || team.created_by === user.id,
      deleteTeam:  isAdmin,

      // Projects
      createProject:  isAdmin || isManager,
      manageProject:  (project: Pick<Project, 'manager_id' | 'tech_lead_id'>) =>
                        isAdmin ||
                        project.manager_id  === user.id ||
                        project.tech_lead_id === user.id,
      deleteProject:  isAdmin,

      // Tasks
      manageTask: (assignedTo: string) => isAdmin || assignedTo === user.id,

      // Settings
      accessSettings: isAdmin,
    },
  }
}
```

---

## STEP 5 — Frontend: PermissionGate component

### components/shared/PermissionGate.tsx

A wrapper component that conditionally renders children based on permissions:

```typescript
'use client'

interface PermissionGateProps {
  allowed: boolean
  children: React.ReactNode
  fallback?: React.ReactNode  // optional replacement UI
}

export const PermissionGate = ({
  allowed,
  children,
  fallback = null,
}: PermissionGateProps) => {
  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

// Usage examples:
//
// Hide delete button from non-admins:
// <PermissionGate allowed={can.deleteProject}>
//   <button onClick={handleDelete}>Delete</button>
// </PermissionGate>
//
// Show read-only badge instead of edit button:
// <PermissionGate allowed={can.manageProject(project)} fallback={<span>View only</span>}>
//   <button onClick={handleEdit}>Edit</button>
// </PermissionGate>
```

---

## STEP 6 — Frontend: Apply permissions to all pages

### Update app/(app)/employees/page.tsx
```typescript
const { can } = usePermissions()

// "+ Add Employee" button:
<PermissionGate allowed={can.createEmployee}>
  <button onClick={() => openModal('add-employee')}>+ Add Employee</button>
</PermissionGate>

// In table row actions (3-dot menu):
// Always show "View Profile"
// Conditionally show "Edit" and "Deactivate":
<PermissionGate allowed={can.editEmployee(employee.id)}>
  <DropdownItem onClick={() => openEditModal(employee)}>Edit</DropdownItem>
</PermissionGate>
<PermissionGate allowed={can.deactivateEmployee}>
  <DropdownItem onClick={() => confirmDeactivate(employee)} danger>
    Deactivate
  </DropdownItem>
</PermissionGate>
```

### Update app/(app)/employees/[id]/page.tsx
```typescript
const { can } = usePermissions()

// "Edit Profile" button — only if admin or viewing own profile:
<PermissionGate allowed={can.editEmployee(employee.id)}>
  <button onClick={handleEdit}>Edit Profile</button>
</PermissionGate>

// "Deactivate Account" button — admin only:
<PermissionGate allowed={can.deactivateEmployee}>
  <button onClick={confirmDeactivate} className="text-red-600">
    Deactivate Account
  </button>
</PermissionGate>
```

### Update app/(app)/teams/page.tsx
```typescript
const { can } = usePermissions()

// "+ Create Team" button:
<PermissionGate allowed={can.createTeam}>
  <button onClick={() => openModal('create-team')}>+ Create Team</button>
</PermissionGate>
```

### Update app/(app)/teams/[id]/page.tsx
```typescript
const { can, isAdmin } = usePermissions()

// Edit team button:
<PermissionGate allowed={can.manageTeam(team)}>
  <button onClick={handleEdit}>Edit Team</button>
</PermissionGate>

// Delete team button:
<PermissionGate allowed={can.deleteTeam}>
  <button onClick={confirmDelete} className="text-red-600">Delete Team</button>
</PermissionGate>

// Add member button:
<PermissionGate allowed={can.manageTeam(team)}>
  <AddMemberSearch teamId={team.id} ... />
</PermissionGate>

// Remove member button (per row):
// Check ownership first — creator cannot be removed
<PermissionGate allowed={can.manageTeam(team) && member.id !== team.created_by}>
  <button onClick={() => handleRemove(member.id)}>Remove</button>
</PermissionGate>
```

### Update app/(app)/projects/page.tsx
```typescript
const { can } = usePermissions()

// "+ Add Project" button:
<PermissionGate allowed={can.createProject}>
  <button onClick={() => openModal('add-project')}>+ Add Project</button>
</PermissionGate>

// In table row 3-dot menu:
<PermissionGate allowed={can.manageProject(project)}>
  <DropdownItem onClick={() => openEdit(project)}>Edit</DropdownItem>
</PermissionGate>
<PermissionGate allowed={can.deleteProject}>
  <DropdownItem onClick={() => confirmDelete(project)} danger>Delete</DropdownItem>
</PermissionGate>
```

### Update app/(app)/projects/[id]/page.tsx
```typescript
const { can } = usePermissions()

// "Edit Project" button in header:
<PermissionGate allowed={can.manageProject(project)}>
  <button onClick={handleEdit}>Edit Project</button>
</PermissionGate>

// Team tab — Add/Remove member buttons:
<PermissionGate allowed={can.manageProject(project)}>
  <AddMemberSearch projectId={project.id} ... />
</PermissionGate>

// Per-member remove button:
<PermissionGate allowed={can.manageProject(project)}>
  <button onClick={() => handleRemoveMember(member.id)}>Remove</button>
</PermissionGate>
```

### Update app/(app)/my/tasks/page.tsx
```typescript
// Tasks are always own — no changes needed for list
// But if admin wants to edit others' tasks (future feature), gate it:
const { can } = usePermissions()

// Edit/delete task — check ownership:
<PermissionGate allowed={can.manageTask(task.assigned_to)}>
  <button onClick={() => openEdit(task)}>Edit</button>
</PermissionGate>
```

### Update components/layout/Sidebar.tsx
```typescript
const { can } = usePermissions()

// Settings nav item — admin only:
{can.accessSettings && (
  <NavItem href="/settings" icon={Settings} label="Settings" />
)}
```

### Update app/(app)/settings/page.tsx
```typescript
// Already has redirect guard — verify it's using usePermissions:
const { can } = usePermissions()
useEffect(() => {
  if (user && !can.accessSettings) router.push('/dashboard')
}, [user, can.accessSettings])
```

---

## STEP 7 — Backend: Add permission-aware error responses

Update all controllers to return consistent 403 responses.
Ensure the error format matches what the frontend Axios interceptor expects:

```typescript
// Standard permission error format:
res.status(403).json({
  message: 'Insufficient permissions',
  required: 'admin',        // optional — what was required
  action: 'delete_project', // optional — what was attempted
})
```

### Update client/lib/axios.ts — handle 403 gracefully:
```typescript
// In the response error interceptor, after the 401 handling:
if (error.response?.status === 403) {
  // Dispatch a warning toast
  store.dispatch(addToast({
    type: 'warning',
    message: error.response.data?.message ?? 'You do not have permission to do that',
  }))
  return Promise.reject(error)
}
```

This means even if a button is shown by mistake (frontend bug),
the API will reject it AND the user sees a clear toast message.

---

## STEP 8 — Backend: Add ownership validation to service layer

Some services already scope queries to `user_id` (tasks, notes).
Verify these are correctly enforced and add any missing checks:

### Verify server/src/services/task.service.ts:
```typescript
// findByUser — already scoped ✓
// findById — already checks assigned_to === userId ✓
// update — already checks assigned_to === userId ✓
// remove — already checks assigned_to === userId ✓
// countOpenByUser — already scoped ✓
// getTodayByUser — already scoped ✓
```

### Verify server/src/services/note.service.ts:
```typescript
// findByUser — already scoped ✓
// findById — already checks user_id === userId ✓
// update — already checks user_id === userId ✓
// remove — already checks user_id === userId ✓
```

### Add to server/src/services/employee.service.ts:

The `update` function currently takes an `id` and `input` — it needs `actorId`
to check ownership for non-admin edits. The middleware already handles this,
but add a safety check in the service as defense-in-depth:

```typescript
export const update = async (
  id: string,
  actorId: string,
  actorRole: string,
  input: UpdateEmployeeInput
) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  // Defense-in-depth: double-check ownership even though middleware should catch it
  if (actorRole !== 'admin' && id !== actorId) {
    throw new Error('FORBIDDEN')
  }

  Object.assign(user, input)
  return repo().save(user)
}
```

Update employee controller to pass actorId and actorRole:
```typescript
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await EmployeeService.update(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body
    )
    res.json(user)
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Insufficient permissions' })
      return
    }
    // ... rest of error handling
  }
}
```

---

## STEP 9 — Testing permissions

After implementing, manually test each permission boundary:

### Test script (run these API calls with different user tokens):

```
# Login as employee (ananya@orgsphere.io / Password123!)
# Then try these — all should return 403:

PUT  /api/employees/[some-other-id]     → 403 (can't edit others)
POST /api/employees                     → 403 (can't create)
POST /api/teams                         → 403 (can't create team)
POST /api/projects                      → 403 (can't create project)
PUT  /api/projects/[any-project-id]     → 403 (not manager/lead)
DELETE /api/projects/[any-id]           → 403 (not admin)
GET  /api/settings/overview             → 403 (not admin)

# Login as manager (priya@orgsphere.io / Password123!)
# These should SUCCEED:

POST /api/employees                     → 201 (managers can create)
POST /api/teams                         → 201 (managers can create)
POST /api/projects                      → 201 (managers can create)
PUT  /api/projects/[priya-managed-id]   → 200 (owns this project)

# These should FAIL for manager:
PUT  /api/projects/[not-managed-id]     → 403 (doesn't own)
DELETE /api/projects/[any-id]           → 403 (not admin)
PUT  /api/employees/[other-id]          → 403 (not admin)

# Login as admin (sumit@orgsphere.io / Password123!)
# All operations should succeed for admin
```

---

## ACCEPTANCE CRITERIA — Permissions are complete when:

Backend enforcement:
- [ ] Employee trying to edit another employee's profile → 403
- [ ] Employee trying to create a project → 403
- [ ] Employee trying to access settings → 403
- [ ] Manager trying to edit a project they don't manage → 403
- [ ] Manager CAN edit a project they manage (manager_id matches)
- [ ] Tech lead CAN edit a project they lead (tech_lead_id matches)
- [ ] Admin can do everything — no 403s for admin role
- [ ] Trying to edit a task assigned to someone else → 403
- [ ] Trying to read another user's notes → 403
- [ ] Trying to delete a team as non-admin → 403
- [ ] Team creator CAN edit their own team
- [ ] 403 responses always include a human-readable message

Frontend gating:
- [ ] Employee logged in: "+ Add Project" button not visible
- [ ] Employee logged in: "+ Add Employee" button not visible
- [ ] Employee logged in: "Settings" nav item not visible
- [ ] Employee logged in: "Delete" buttons not visible on any entity
- [ ] Manager logged in: can see "+ Add Project", "+ Add Employee"
- [ ] Manager logged in: "Edit" button visible only on their own projects
- [ ] Admin logged in: all buttons visible everywhere
- [ ] 403 response from API shows warning toast to user

Defense in depth:
- [ ] Service layer ownership checks work independently of middleware
- [ ] Frontend hiding a button doesn't bypass backend — API rejects anyway
- [ ] Zero TypeScript errors (tsc --noEmit)
