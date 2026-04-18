import { UserRole } from '../entities/User'

export type PermissionAction =
  | 'employees.create'
  | 'employees.edit_any'
  | 'employees.edit_own'
  | 'employees.deactivate'
  | 'teams.create'
  | 'teams.manage'
  | 'teams.delete'
  | 'projects.create'
  | 'projects.manage'
  | 'projects.delete'
  | 'tasks.manage_any'
  | 'notes.manage_own'
  | 'settings.access'

export const ROLE_HIERARCHY: UserRole[] = ['viewer', 'employee', 'tech_lead', 'manager', 'hr', 'admin']

export const hasMinRole = (userRole: UserRole, minRole: UserRole): boolean =>
  ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)

export const PERMISSIONS: Record<PermissionAction, UserRole[]> = {
  'employees.create': ['admin', 'manager', 'hr'],
  'employees.edit_any': ['admin', 'hr'],
  'employees.edit_own': ['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer'],
  'employees.deactivate': ['admin', 'hr'],
  'teams.create': ['admin', 'manager'],
  'teams.manage': ['admin'],
  'teams.delete': ['admin'],
  'projects.create': ['admin', 'manager'],
  'projects.manage': ['admin'],
  'projects.delete': ['admin'],
  'tasks.manage_any': ['admin'],
  'notes.manage_own': ['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer'],
  'settings.access': ['admin'],
}

export const can = (userRole: UserRole, action: PermissionAction): boolean =>
  PERMISSIONS[action].includes(userRole)

export const isUserRole = (role: string): role is UserRole =>
  ROLE_HIERARCHY.includes(role as UserRole)
