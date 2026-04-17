import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Employee } from '@/types'
import { roleLabels } from './constants'

interface EmployeeTableProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDeactivate: (employee: Employee) => void
  canEditEmployee: (employee: Employee) => boolean
  canDeactivateEmployee: (employee: Employee) => boolean
}

const visibleSkills = (skills: string[]) => ({
  shown: skills.slice(0, 2),
  extra: Math.max(skills.length - 2, 0),
})

export function EmployeeTable({
  employees,
  onEdit,
  onDeactivate,
  canEditEmployee,
  canDeactivateEmployee,
}: EmployeeTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-3 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead className="sticky top-0 bg-[color:var(--color-surface-card)]">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Employee
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Role
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Department
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Skills
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Status
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const skills = visibleSkills(employee.skills)
              const canEdit = canEditEmployee(employee)
              const canDeactivate = canDeactivateEmployee(employee)
              const hasMenuActions = canEdit || canDeactivate

              return (
                <tr
                  key={employee.id}
                  className="h-[52px] rounded-xl bg-[color:var(--color-surface-low)] transition-colors hover:bg-[color:var(--color-surface-high)]"
                >
                  <td className="rounded-l-xl px-5 py-3">
                    <Link href={`/employees/${employee.id}`} className="flex items-center gap-3">
                      <Avatar
                        name={employee.name}
                        avatarPath={employee.avatar_path}
                        size="lg"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                          {employee.name}
                        </span>
                        <span className="block truncate text-xs text-[color:var(--color-text-tertiary)]">
                          {employee.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-[color:var(--color-text-secondary)]">{roleLabels[employee.role]}</td>
                  <td className="px-5 py-3 text-sm text-[color:var(--color-text-secondary)]">
                    {employee.department || 'Unassigned'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {skills.shown.length > 0 ? (
                        skills.shown.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[color:var(--color-surface-card)] px-2 py-0.5 text-xs font-medium text-[color:var(--color-text-secondary)]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[color:var(--color-text-tertiary)]">No skills</span>
                      )}
                      {skills.extra > 0 ? (
                        <span className="rounded-full bg-[color:var(--color-surface-card)] px-2 py-0.5 text-xs font-medium text-[color:var(--color-text-tertiary)]">
                          +{skills.extra}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={employee.is_active ? 'active' : 'archived'} />
                  </td>
                  <td className="rounded-r-xl px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-card)]"
                      >
                        View
                      </Link>
                      {hasMenuActions ? (
                        <details className="relative">
                          <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-card)]">
                            <MoreHorizontal size={16} />
                          </summary>
                          <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl bg-white/90 p-1 text-left shadow-[var(--shadow-modal)] backdrop-blur-md">
                            {canEdit ? (
                              <button
                                type="button"
                                onClick={() => onEdit(employee)}
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]"
                              >
                                Edit
                              </button>
                            ) : null}
                          {canDeactivate ? (
                            <button
                              type="button"
                              onClick={() => onDeactivate(employee)}
                              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Deactivate
                            </button>
                          ) : null}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
