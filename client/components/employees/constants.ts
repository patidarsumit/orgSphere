import { UserRole } from '@/types'

export const employeeRoles: UserRole[] = ['admin', 'manager', 'tech_lead', 'employee']

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  tech_lead: 'Tech Lead',
  employee: 'Employee',
}

export const viewOptions = ['grid', 'table'] as const

export type EmployeeView = (typeof viewOptions)[number]
