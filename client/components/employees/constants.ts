import { UserRole } from '@/types'

export const employeeRoles: UserRole[] = ['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer']

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  hr: 'HR',
  manager: 'Manager',
  tech_lead: 'Tech Lead',
  employee: 'Employee',
  viewer: 'Viewer',
}

export const viewOptions = ['grid', 'table'] as const

export type EmployeeView = (typeof viewOptions)[number]
