'use client'

import Link from 'next/link'
import { type MouseEvent, useEffect, useMemo, useState, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import {
  commonTech,
  projectStatusOptions,
  statusDotClassName,
  truncateText,
} from '@/components/projects/projectUtils'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePermissions } from '@/hooks/usePermissions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useDeleteProject, useProjects } from '@/hooks/useProjects'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { Project, ProjectStatus } from '@/types'

const pageNumbersFor = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function ProjectsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-3 shadow-sm">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="mb-2 grid grid-cols-12 gap-4 rounded-xl bg-[color:var(--color-surface-low)] p-4">
          <div className="col-span-3 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-3 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
        </div>
      ))}
    </div>
  )
}

function ProjectTechStack({ technologies }: { technologies: string[] }) {
  const visibleTech = technologies.slice(0, 2)
  const hiddenTechCount = Math.max(technologies.length - visibleTech.length, 0)

  if (technologies.length === 0) {
    return <span className="text-sm text-[color:var(--color-text-tertiary)]">No tech</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTech.map((tech) => (
        <span
          key={tech}
          title={tech}
        >
          <TechStackChip tech={tech} size="sm" />
        </span>
      ))}
      {hiddenTechCount > 0 ? (
        <span className="rounded-full bg-[color:var(--color-surface-card)] px-2 py-0.5 text-xs font-medium text-[color:var(--color-text-tertiary)]">
          +{hiddenTechCount}
        </span>
      ) : null}
    </div>
  )
}

function ProjectAvatarStack({ project }: { project: Project }) {
  const people = project.project_members.map((member) => member.user).slice(0, 3)
  const hiddenCount = Math.max(project.project_members.length - people.length, 0)

  if (people.length === 0) {
    return <span className="text-sm text-[color:var(--color-text-tertiary)]">-</span>
  }

  return (
    <div className="flex -space-x-2">
      {people.map((person) => (
        <Link
          key={person.id}
          href={`/employees/${person.id}`}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => event.stopPropagation()}
          className="rounded-full transition-transform hover:z-10 hover:-translate-y-0.5"
          title={person.name}
        >
          <Avatar name={person.name} avatarPath={person.avatar_path} size="sm" />
        </Link>
      ))}
      {hiddenCount > 0 ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[color:var(--color-primary-light)] text-[10px] font-black text-[color:var(--color-primary)]">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  )
}

function ProjectActions({
  project,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  canEdit: boolean
  canDelete: boolean
}) {
  return (
    <div className="inline-flex items-center justify-end gap-1">
      <Link
        href={`/projects/${project.id}`}
        aria-label={`View ${project.name}`}
        title="View project"
        className="rounded-lg p-2 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-card)]"
      >
        <Eye size={16} />
      </Link>
      {canEdit ? (
        <button
          type="button"
          onClick={() => onEdit(project)}
          aria-label={`Edit ${project.name}`}
          title="Edit project"
          className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-card)]"
        >
          <Pencil size={16} />
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(project)}
          aria-label={`Delete ${project.name}`}
          title="Delete project"
          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  )
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  canEdit: boolean
  canDelete: boolean
}) {
  return (
    <tr className="h-[52px] rounded-xl bg-[color:var(--color-surface-low)] transition-colors hover:bg-[color:var(--color-surface-high)]">
      <td className="rounded-l-xl px-5 py-3">
        <div className="min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
          >
            {project.name}
          </Link>
          <span className="block max-w-[260px] truncate text-xs text-[color:var(--color-text-tertiary)]">
            {truncateText(project.description, 58)}
          </span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDotClassName[project.status]}`} />
          <StatusBadge status={project.status} />
        </div>
      </td>
      <td className="px-5 py-3">
        <ProjectTechStack technologies={project.tech_stack} />
      </td>
      <td className="px-5 py-3">
        <ProjectAvatarStack project={project} />
      </td>
      <td className="px-5 py-3">
        <div className="space-y-1">
          {project.tech_lead ? (
            <Link
              href={`/employees/${project.tech_lead.id}`}
              className="block text-sm font-medium text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
            >
              {project.tech_lead.name}
            </Link>
          ) : null}
          {project.manager ? (
            <Link
              href={`/employees/${project.manager.id}`}
              className="block text-xs text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-primary)]"
            >
              {project.manager.name}
            </Link>
          ) : null}
          {!project.tech_lead && !project.manager ? (
            <span className="text-sm text-[color:var(--color-text-tertiary)]">-</span>
          ) : null}
        </div>
      </td>
      <td className="rounded-r-xl px-5 py-3 text-right">
        <ProjectActions
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </td>
    </tr>
  )
}

export default function ProjectsPage() {
  const { can } = usePermissions()
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const deleteProject = useDeleteProject()
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ startTransition })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [tech, setTech] = useQueryState(
    'tech',
    parseAsString.withDefault('').withOptions({ startTransition })
  )
  const [searchInput, setSearchInput] = useState(search)
  const { data, isLoading, isError } = useProjects({
    page,
    limit: 10,
    search,
    status: status as ProjectStatus | '',
    tech,
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

  const projects = useMemo(() => data?.data || [], [data?.data])
  const totalProjects = data?.total || 0
  const totalPages = data?.totalPages || 1
  const pageNumbers = pageNumbersFor(page, totalPages)
  const hasFilters = Boolean(search || status || tech)
  const showingStart = totalProjects === 0 ? 0 : (page - 1) * 10 + 1
  const showingEnd = Math.min(page * 10, totalProjects)

  const availableTech = useMemo(() => {
    const fromProjects = projects.flatMap((project) => project.tech_stack)
    return Array.from(new Set([...commonTech, ...fromProjects])).slice(0, 8)
  }, [projects])

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setStatus('')
    setTech('')
  }

  const onEdit = (project: Project) => {
    setEditingProject(project)
    setModalOpen(true)
  }

  const onDelete = async (project: Project) => {
    if (window.confirm(`Delete ${project.name}?`)) {
      try {
        await deleteProject.mutateAsync(project.id)
        appToast.success('Project deleted')
      } catch (error) {
        appToast.error(getToastErrorMessage(error, 'Unable to delete project'))
      }
    }
  }

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="w-full space-y-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-[color:var(--color-text-primary)]">
                Projects
              </h1>
              <span className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-xs font-black uppercase tracking-widest text-[color:var(--color-primary)]">
                Active Workspace
              </span>
            </div>
            <p className="mt-2 max-w-2xl font-medium text-[color:var(--color-text-tertiary)]">
              Track delivery, owners, teams, and technology choices across {totalProjects} projects.
            </p>
          </div>
          {can.createProject ? (
            <button
              type="button"
              onClick={() => {
                setEditingProject(undefined)
                setModalOpen(true)
              }}
              className="primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(53,37,205,0.8)] active:scale-95"
            >
              <Plus size={18} />
              Add Project
            </button>
          ) : null}
        </header>

        <section className="rounded-3xl bg-[color:var(--color-surface-card)] p-4 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_190px_auto] lg:items-center">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Filter by name, lead, or manager..."
                className="h-11 w-full rounded-xl border border-[color:var(--color-border)] bg-white pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setPage(1)
                setStatus(event.target.value)
              }}
              className="h-11 rounded-xl border border-[color:var(--color-border)] bg-white px-3 text-sm font-semibold text-[color:var(--color-text-secondary)] outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            >
              <option value="">All Projects</option>
              {projectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-bold text-[color:var(--color-primary)] hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs font-black uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
              Tech Stack:
            </span>
            {availableTech.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setPage(1)
                  setTech(tech === item ? '' : item)
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  tech === item
                    ? 'bg-[color:var(--color-primary)] text-white'
                    : 'bg-white text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-border)] hover:text-[color:var(--color-primary)]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {isPending ? (
          <p className="text-sm text-[color:var(--color-text-tertiary)]">Updating projects...</p>
        ) : null}
        {isLoading ? <ProjectsTableSkeleton /> : null}
        {isError ? (
          <EmptyState
            icon={FolderKanban}
            title="Projects unavailable"
            description="Project data could not be loaded right now."
          />
        ) : null}
        {!isLoading && !isError && projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
            description={hasFilters ? 'Try clearing filters or changing your search.' : 'Create your first project workspace.'}
            action={
              can.createProject
                ? { label: 'Create your first project', onClick: () => setModalOpen(true) }
                : undefined
            }
          />
        ) : null}

        {!isLoading && !isError && projects.length > 0 ? (
          <>
            <section className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-3 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2 text-left">
                  <thead className="sticky top-0 bg-[color:var(--color-surface-card)]">
                    <tr>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Project
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Tech Stack
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Team
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Lead / Manager
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        canEdit={can.manageProject(project)}
                        canDelete={can.deleteProject}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-4 flex flex-col gap-4 border-t border-[color:var(--color-border-strong)] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[color:var(--color-text-tertiary)]">
                Showing {showingStart}-{showingEnd} of {totalProjects} results
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
      </div>

      <ProjectFormModal
        open={modalOpen}
        project={editingProject}
        onClose={() => {
          setModalOpen(false)
          setEditingProject(undefined)
        }}
      />
    </div>
  )
}
