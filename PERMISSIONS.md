# OrgSphere Permissions

OrgSphere uses role-based access control with ownership checks. The backend is the source of truth; frontend checks only hide or show UI actions.

## Roles

Broadest to narrowest:

1. `admin`
2. `hr`
3. `manager`
4. `tech_lead`
5. `employee`
6. `viewer`

Note: roles are not treated as a pure hierarchy for every action. `hr` is lateral and focused on employee records, not project or settings control.

## Access Summary

| Area | Admin | HR | Manager | Tech Lead | Employee | Viewer |
| --- | --- | --- | --- | --- | --- | --- |
| View employees | Yes | Yes | Yes | Yes | Yes | Yes |
| Create employees | Yes | Yes | Yes | No | No | No |
| Edit any employee | Yes | Yes | No | No | No | No |
| Edit own profile | Yes | Yes | Yes | Yes | Yes | Yes |
| Deactivate employees | Yes | Yes, except admin accounts | No | No | No | No |
| View teams | Yes | Yes | Yes | Yes | Yes | Yes |
| Create teams | Yes | No | Yes | No | No | No |
| Edit/manage own created team | Yes | Creator only | Creator only | Creator only | Creator only | Creator only |
| Delete teams | Yes | No | No | No | No | No |
| View projects | Yes | Yes | Yes | Yes | Yes | Yes |
| Create projects | Yes | No | Yes | No | No | No |
| Edit/manage project | Yes | No | If project manager | If tech lead | No | No |
| Delete projects | Yes | No | No | No | No | No |
| View own tasks | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage own tasks | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage any task | Yes | No | No | No | No | No |
| View/manage own notes | Yes | Yes | Yes | Yes | Yes | Yes |
| View/manage others' notes | No | No | No | No | No | No |
| View activity feed | Yes | Yes | Yes | Yes | Yes | Yes |
| Access settings | Yes | No | No | No | No | No |

## Ownership Rules

### Employees

- Everyone can view the employee directory.
- Admins can edit any employee.
- HR can edit employee records across the org.
- Users can edit their own profile.
- Non-admin self-edit is limited to safe profile fields:
  - name
  - department
  - skills
  - avatar
- Non-admin users cannot change their own role, manager, or active status.
- Admins can create any role.
- HR can create `employee` and `viewer` users.
- Managers can create `tech_lead`, `employee`, and `viewer` users.
- Admins and HR can deactivate employees.
- HR cannot deactivate admin accounts.

### Teams

- Everyone can view teams.
- Admins and managers can create teams.
- A team can be edited by:
  - admin
  - the user who created the team
- Team membership can be managed by:
  - admin
  - the user who created the team
- Only admins can delete teams.

### Projects

- Everyone can view projects.
- Admins and managers can create projects.
- A project can be edited by:
  - admin
  - assigned project manager
  - assigned tech lead
- Project members and project member roles can be managed by:
  - admin
  - assigned project manager
  - assigned tech lead
- Only admins can delete projects.

### Tasks

- Users can create tasks for themselves.
- Users can view and manage tasks assigned to themselves.
- Admins can manage any task.
- Project task lists may show tasks for a project, but task updates are still permission-checked.

### Notes

- Notes are strictly private.
- Users can view, create, update, and delete only their own notes.
- Admins do not get normal access to other users' notes.

### Settings

- Organization settings and role management are admin-only.
- Profile and password APIs are available to authenticated users, but the current Settings page is admin-only.

## Implementation Locations

Backend:

- Permission definitions: `server/src/permissions/index.ts`
- Permission middleware: `server/src/middleware/permissions.ts`
- Route enforcement:
  - `server/src/routes/employee.routes.ts`
  - `server/src/routes/team.routes.ts`
  - `server/src/routes/project.routes.ts`
  - `server/src/routes/task.routes.ts`
  - `server/src/routes/note.routes.ts`
  - `server/src/routes/settings.routes.ts`
- Defense-in-depth service checks:
  - `server/src/services/employee.service.ts`
  - `server/src/services/team.service.ts`
  - `server/src/services/project.service.ts`
  - `server/src/services/task.service.ts`

Frontend:

- Permission hook: `client/hooks/usePermissions.ts`
- Optional render wrapper: `client/components/shared/PermissionGate.tsx`
- 403 warning toast handling: `client/lib/axios.ts`

## Important Rule

Frontend permissions are not security. If a button is accidentally shown, the API must still reject unauthorized requests with `403`.
