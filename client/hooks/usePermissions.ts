'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Employee, Project, Team, Task, UserRole } from '@/types'

const ROLE_HIERARCHY: UserRole[] = ['employee', 'tech_lead', 'manager', 'admin']

const hasMinRole = (userRole: UserRole, minRole: UserRole): boolean =>
  ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minRole)

export function usePermissions() {
  const user = useSelector((state: RootState) => state.auth.user)

  return useMemo(() => {
    const role = user?.role
    const isAdmin = role === 'admin'
    const isManager = role ? hasMinRole(role, 'manager') : false
    const isTechLead = role ? hasMinRole(role, 'tech_lead') : false

    return {
      user,
      role,
      isAdmin,
      isManager,
      isTechLead,
      can: {
        createEmployee: isAdmin || isManager,
        editEmployee: (employeeOrId: Pick<Employee, 'id'> | string) => {
          const targetId = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId.id
          return Boolean(user && (isAdmin || targetId === user.id))
        },
        deactivateEmployee: (employeeOrId?: Pick<Employee, 'id'> | string) => {
          const targetId =
            typeof employeeOrId === 'string' ? employeeOrId : employeeOrId?.id
          return Boolean(isAdmin && (!targetId || targetId !== user?.id))
        },
        createTeam: isAdmin || isManager,
        manageTeam: (team: Pick<Team, 'created_by'>) =>
          Boolean(user && (isAdmin || team.created_by === user.id)),
        deleteTeam: isAdmin,
        createProject: isAdmin || isManager,
        manageProject: (project: Pick<Project, 'manager_id' | 'tech_lead_id'>) =>
          Boolean(
            user &&
              (isAdmin || project.manager_id === user.id || project.tech_lead_id === user.id)
          ),
        deleteProject: isAdmin,
        manageTask: (taskOrAssignedTo: Pick<Task, 'assigned_to'> | string) => {
          const assignedTo =
            typeof taskOrAssignedTo === 'string' ? taskOrAssignedTo : taskOrAssignedTo.assigned_to
          return Boolean(user && (isAdmin || assignedTo === user.id))
        },
        accessSettings: isAdmin,
      },
    }
  }, [user])
}
