'use client'

import { KeyboardEvent, useMemo, useRef, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { roleLabels } from '@/components/employees/constants'
import { Avatar } from '@/components/shared/Avatar'
import { useEmployees } from '@/hooks/useEmployees'
import { useAddProjectMember } from '@/hooks/useProjects'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { User } from '@/types'

interface AddProjectMemberSearchProps {
  projectId: string
  existingMemberIds: string[]
}

const filterEmployees = (employees: User[], existingMemberIds: string[], query: string) => {
  const existing = new Set(existingMemberIds)
  const normalizedQuery = query.trim().toLowerCase()

  return employees.filter((employee) => {
    if (existing.has(employee.id) || !employee.is_active) {
      return false
    }
    if (!normalizedQuery) {
      return true
    }
    return (
      employee.name.toLowerCase().includes(normalizedQuery) ||
      employee.email.toLowerCase().includes(normalizedQuery)
    )
  })
}

export function AddProjectMemberSearch({
  projectId,
  existingMemberIds,
}: AddProjectMemberSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('Member')
  const [activeIndex, setActiveIndex] = useState(0)
  const addMember = useAddProjectMember(projectId)
  const { data } = useEmployees({ limit: 100, is_active: true })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const options = useMemo(
    () => filterEmployees(data?.data || [], existingMemberIds, query),
    [data?.data, existingMemberIds, query]
  )

  const addSelectedMember = async (employee: User) => {
    try {
      await addMember.mutateAsync({ user_id: employee.id, role: role.trim() || 'Member' })
      appToast.success(`${employee.name} added to project`)
      setQuery('')
      setRole('Member')
      setActiveIndex(0)
      setOpen(false)
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to add project member'))
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(options.length - 1, 0)))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    }
    if (event.key === 'Enter' && options[activeIndex]) {
      event.preventDefault()
      void addSelectedMember(options[activeIndex])
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
        >
          <Plus size={16} />
          Add Member
        </button>
      ) : (
        <div className="w-full rounded-2xl bg-white p-3 shadow-[var(--shadow-modal)] ring-1 ring-[color:var(--color-border-strong)] sm:w-96">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_150px]">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
              />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onBlur={(event) => {
                  if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
                    setOpen(false)
                  }
                }}
                onKeyDown={onKeyDown}
                autoFocus
                placeholder="Search employees"
                className="h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-low)] pl-9 pr-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
              />
            </div>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
              className="h-10 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-low)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
            />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[color:var(--color-text-tertiary)]">
                No more employees to add.
              </p>
            ) : (
              options.map((employee, index) => (
                <button
                  key={employee.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void addSelectedMember(employee)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    index === activeIndex
                      ? 'bg-[color:var(--color-primary-light)]'
                      : 'hover:bg-[color:var(--color-surface-low)]'
                  }`}
                >
                  <Avatar name={employee.name} avatarPath={employee.avatar_path} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {employee.name}
                    </span>
                    <span className="block truncate text-xs text-[color:var(--color-text-tertiary)]">
                      {roleLabels[employee.role]}
                    </span>
                  </span>
                  {addMember.isPending ? (
                    <span className="text-xs text-[color:var(--color-text-tertiary)]">Adding</span>
                  ) : (
                    <Check size={15} className="text-[color:var(--color-primary)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
