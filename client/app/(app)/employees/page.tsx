'use client'

import { useEffect, useState, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { EmployeeCard } from '@/components/employees/EmployeeCard'
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { EmployeeView, employeeRoles, roleLabels, viewOptions } from '@/components/employees/constants'
import { SkillsFilter } from '@/components/employees/SkillsFilter'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDeactivateEmployee, useEmployees } from '@/hooks/useEmployees'
import { RootState } from '@/store'
import { Employee, UserRole } from '@/types'

const isUserRole = (value: string): value is UserRole =>
  employeeRoles.includes(value as UserRole)

const pageNumbersFor = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="min-h-[238px] animate-pulse rounded-2xl bg-[color:var(--color-surface-card)] p-6"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[color:var(--color-surface-low)]" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 rounded bg-[color:var(--color-surface-low)]" />
              <div className="h-3 w-1/2 rounded bg-[color:var(--color-surface-low)]" />
              <div className="h-3 w-2/3 rounded bg-[color:var(--color-surface-low)]" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-3 rounded bg-[color:var(--color-surface-low)]" />
            <div className="h-3 w-4/5 rounded bg-[color:var(--color-surface-low)]" />
          </div>
          <div className="mt-6 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-[color:var(--color-surface-low)]" />
            <div className="h-6 w-24 rounded-full bg-[color:var(--color-surface-low)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)]">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="mx-4 my-2 flex h-[52px] animate-pulse items-center gap-4 rounded-xl bg-[color:var(--color-surface-low)] px-5"
        >
          <div className="h-9 w-9 rounded-xl bg-white" />
          <div className="h-3 flex-1 rounded bg-white" />
          <div className="hidden h-3 w-24 rounded bg-white md:block" />
          <div className="hidden h-3 w-28 rounded bg-white lg:block" />
        </div>
      ))}
    </div>
  )
}

export default function EmployeesPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | undefined>()
  const [view, setView] = useState<EmployeeView>('grid')
  const deactivateEmployee = useDeactivateEmployee()
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ startTransition })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [role, setRole] = useQueryState(
    'role',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [skill, setSkill] = useQueryState(
    'skill',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [searchInput, setSearchInput] = useState(search)
  const roleFilter = isUserRole(role) ? role : undefined
  const { data, isFetching, isLoading, isError, refetch } = useEmployees({
    page,
    limit: 12,
    search,
    role: roleFilter,
    skill,
    is_active: true,
  })

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput !== search) {
        setPage(1)
        setSearch(searchInput)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search, searchInput, setPage, setSearch])

  const employees = data?.data || []
  const totalEmployees = data?.total || 0
  const totalPages = data?.totalPages || 1
  const pageNumbers = pageNumbersFor(page, totalPages)
  const firstItem = totalEmployees === 0 ? 0 : (page - 1) * 12 + 1
  const lastItem = Math.min(page * 12, totalEmployees)
  const isAdmin = currentUser?.role === 'admin'

  const resetPageAndSetRole = (nextRole: string) => {
    setPage(1)
    setRole(nextRole)
  }

  const resetPageAndSetSkill = (nextSkill: string) => {
    setPage(1)
    setSkill(nextSkill)
  }

  const clearFilters = () => {
    setSearchInput('')
    setPage(1)
    setSearch('')
    setRole('')
    setSkill('')
  }

  const openCreateModal = () => {
    setEditingEmployee(undefined)
    setModalOpen(true)
  }

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEmployee(undefined)
  }

  const confirmDeactivate = async () => {
    if (!deactivateTarget) {
      return
    }
    await deactivateEmployee.mutateAsync(deactivateTarget.id)
    setDeactivateTarget(undefined)
  }

  const hasFilters = Boolean(search || role || skill)

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-8">
      <div className="w-full space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[color:var(--color-text-primary)]">
            Employees
          </h1>
          <p className="mt-2 font-medium text-[color:var(--color-text-tertiary)]">
            {totalEmployees} members active in OrgSphere
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-[color:var(--color-surface-high)] p-1">
            {viewOptions.map((option) => {
              const Icon = option === 'grid' ? Grid3X3 : List
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    view === option
                      ? 'bg-[color:var(--color-surface-card)] text-[color:var(--color-primary)] shadow-sm'
                      : 'text-[color:var(--color-text-tertiary)] hover:bg-white/50'
                  }`}
                  aria-label={`Use ${option} view`}
                >
                  <Icon size={16} />
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="primary-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(53,37,205,0.8)] transition-all active:scale-95"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-[color:var(--color-surface-low)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email or role..."
            className="h-12 w-full rounded-xl border-none bg-[color:var(--color-surface-card)] pl-12 pr-4 text-sm shadow-sm outline-none transition-all focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={role}
            onChange={(event) => resetPageAndSetRole(event.target.value)}
            className="h-12 cursor-pointer rounded-xl border-none bg-[color:var(--color-surface-card)] px-4 text-sm text-[color:var(--color-text-secondary)] shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
          >
            <option value="">All roles</option>
            {employeeRoles.map((employeeRole) => (
              <option key={employeeRole} value={employeeRole}>
                {roleLabels[employeeRole]}
              </option>
            ))}
          </select>
          <SkillsFilter value={skill} onChange={resetPageAndSetSkill} />
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-12 items-center gap-2 rounded-xl bg-[color:var(--color-surface-card)] px-4 text-sm font-semibold text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:text-[color:var(--color-primary)]"
            >
              <RotateCcw size={15} />
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-surface-card)] text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:text-[color:var(--color-primary)]"
            aria-label="Refresh employee list"
            title="Refresh employees"
          >
            <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        view === 'grid' ? <GridSkeleton /> : <TableSkeleton />
      ) : null}

      {isError ? (
        <EmptyState
          icon={Users}
          title="Directory unavailable"
          description="Employee data could not be loaded right now."
        />
      ) : null}

      {!isLoading && !isError && employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? 'No matching employees' : 'No employees yet'}
          description={
            hasFilters
              ? 'Try a different search, role, or skill filter.'
              : 'Add the first employee profile to start the directory.'
          }
          action={{ label: 'Add Employee', onClick: openCreateModal }}
        />
      ) : null}

      {!isLoading && !isError && employees.length > 0 ? (
        <>
          {isPending ? (
            <p className="text-sm text-[color:var(--color-text-tertiary)]">
              Updating filters...
            </p>
          ) : null}

          {view === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          ) : (
            <EmployeeTable
              employees={employees}
              onEdit={openEditModal}
              onDeactivate={setDeactivateTarget}
              canDeactivate={isAdmin}
            />
          )}

          <div className="mt-12 flex flex-col gap-4 border-t border-[color:var(--color-border-strong)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[color:var(--color-text-tertiary)]">
              Showing {firstItem} to {lastItem} of {totalEmployees} employees
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg bg-[color:var(--color-surface-low)] p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-high)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    page === pageNumber
                      ? 'bg-[color:var(--color-primary)] text-white'
                      : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg bg-[color:var(--color-surface-low)] p-2 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-high)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      ) : null}

      <EmployeeFormModal
        open={modalOpen}
        employee={editingEmployee}
        onClose={closeModal}
      />
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate employee?"
        description="This employee will be removed from active directory views."
        dangerous
        onCancel={() => setDeactivateTarget(undefined)}
        onConfirm={confirmDeactivate}
      />
      </div>
    </div>
  )
}
