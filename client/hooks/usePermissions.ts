'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Employee, Project, Team, Task, UserRole } from '@/types'

const rolePermissions: Record<
  UserRole,
  {
    createEmployee: boolean
    editAnyEmployee: boolean
    deactivateEmployee: boolean
    createTeam: boolean
    deleteTeam: boolean
    createProject: boolean
    deleteProject: boolean
    manageAnyTask: boolean
    accessSettings: boolean
  }
> = {
  admin: {
    createEmployee: true,
    editAnyEmployee: true,
    deactivateEmployee: true,
    createTeam: true,
    deleteTeam: true,
    createProject: true,
    deleteProject: true,
    manageAnyTask: true,
    accessSettings: true,
  },
  hr: {
    createEmployee: true,
    editAnyEmployee: true,
    deactivateEmployee: true,
    createTeam: false,
    deleteTeam: false,
    createProject: false,
    deleteProject: false,
    manageAnyTask: false,
    accessSettings: false,
  },
  manager: {
    createEmployee: true,
    editAnyEmployee: false,
    deactivateEmployee: false,
    createTeam: true,
    deleteTeam: false,
    createProject: true,
    deleteProject: false,
    manageAnyTask: false,
    accessSettings: false,
  },
  tech_lead: {
    createEmployee: false,
    editAnyEmployee: false,
    deactivateEmployee: false,
    createTeam: false,
    deleteTeam: false,
    createProject: false,
    deleteProject: false,
    manageAnyTask: false,
    accessSettings: false,
  },
  employee: {
    createEmployee: false,
    editAnyEmployee: false,
    deactivateEmployee: false,
    createTeam: false,
    deleteTeam: false,
    createProject: false,
    deleteProject: false,
    manageAnyTask: false,
    accessSettings: false,
  },
  viewer: {
    createEmployee: false,
    editAnyEmployee: false,
    deactivateEmployee: false,
    createTeam: false,
    deleteTeam: false,
    createProject: false,
    deleteProject: false,
    manageAnyTask: false,
    accessSettings: false,
  },
}

export function usePermissions() {
  const user = useSelector((state: RootState) => state.auth.user)

  return useMemo(() => {
    const role = user?.role
    const isAdmin = role === 'admin'
    const isHr = role === 'hr'
    const isManager = role === 'manager'
    const isTechLead = role === 'tech_lead'
    const currentPermissions = role ? rolePermissions[role] : null

    return {
      user,
      role,
      isAdmin,
      isHr,
      isManager,
      isTechLead,
      can: {
        createEmployee: currentPermissions?.createEmployee ?? false,
        editEmployee: (employeeOrId: Pick<Employee, 'id'> | string) => {
          const targetId = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId.id
          return Boolean(user && ((currentPermissions?.editAnyEmployee ?? false) || targetId === user.id))
        },
        deactivateEmployee: (employeeOrId?: Pick<Employee, 'id'> | string) => {
          const target =
            typeof employeeOrId === 'string' ? { id: employeeOrId } : employeeOrId
          const targetId = target?.id
          const targetRole = target && 'role' in target ? target.role : undefined
          if (!currentPermissions?.deactivateEmployee) return false
          if (targetId && targetId === user?.id) return false
          if (role === 'hr' && targetRole === 'admin') return false
          return true
        },
        createTeam: currentPermissions?.createTeam ?? false,
        manageTeam: (team: Pick<Team, 'created_by'>) =>
          Boolean(user && (isAdmin || team.created_by === user.id)),
        deleteTeam: currentPermissions?.deleteTeam ?? false,
        createProject: currentPermissions?.createProject ?? false,
        manageProject: (project: Pick<Project, 'manager_id' | 'tech_lead_id'>) =>
          Boolean(
            user &&
              (isAdmin || project.manager_id === user.id || project.tech_lead_id === user.id)
          ),
        deleteProject: currentPermissions?.deleteProject ?? false,
        manageTask: (taskOrAssignedTo: Pick<Task, 'assigned_to'> | string) => {
          const assignedTo =
            typeof taskOrAssignedTo === 'string' ? taskOrAssignedTo : taskOrAssignedTo.assigned_to
          return Boolean(user && ((currentPermissions?.manageAnyTask ?? false) || assignedTo === user.id))
        },
        accessSettings: currentPermissions?.accessSettings ?? false,
      },
    }
  }, [user])
}
