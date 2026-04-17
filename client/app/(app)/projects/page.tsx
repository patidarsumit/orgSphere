'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  MoreHorizontal,
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useDeleteProject, useProjects } from '@/hooks/useProjects'
import { useTeams } from '@/hooks/useTeams'
import { Project, ProjectStatus } from '@/types'

const pageNumbersFor = (currentPage: number, totalPages: number) => {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function ProjectsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 border-b border-[color:var(--color-border)] p-4">
          <div className="col-span-3 h-5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          <div className="col-span-3 h-5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
        </div>
      ))}
    </div>
  )
}

function ProjectActions({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)] hover:text-[color:var(--color-text-primary)]"
        aria-label={`Project actions for ${project.name}`}
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-10 z-20 w-40 rounded-xl bg-white p-1 shadow-[var(--shadow-modal)] ring-1 ring-[color:var(--color-border)]"
          onClick={(event) => event.stopPropagation()}
        >
          <Link
            href={`/projects/${project.id}`}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]"
          >
            <Pencil size={14} />
            Edit
          </button>
          <div className="my-1 h-px bg-[color:var(--color-border)]" />
          <button
            type="button"
            onClick={() => onDelete(project)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}) {
  const router = useRouter()
  const visibleTech = project.tech_stack.slice(0, 2)
  const hiddenTechCount = Math.max(project.tech_stack.length - visibleTech.length, 0)

  return (
    <tr
      onClick={() => router.push(`/projects/${project.id}`)}
      className="h-16 cursor-pointer border-b border-[color:var(--color-border)] transition-colors hover:bg-[color:var(--color-surface-low)]"
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${statusDotClassName[project.status]}`} />
          <Link
            href={`/projects/${project.id}`}
            onClick={(event) => event.stopPropagation()}
            className="font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
          >
            {project.name}
          </Link>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-[color:var(--color-text-secondary)]">
        {truncateText(project.description, 55)}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={project.status} />
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          {visibleTech.map((tech) => (
            <TechStackChip key={tech} tech={tech} size="sm" />
          ))}
          {hiddenTechCount > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              +{hiddenTechCount}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-5 py-3">
        {project.team ? (
          <Link
            href={`/teams/${project.team.id}`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full bg-[color:var(--color-surface-low)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
          >
            {project.team.name}
          </Link>
        ) : (
          <span className="text-sm text-[color:var(--color-text-tertiary)]">-</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="space-y-1">
          {project.tech_lead ? (
            <Link
              href={`/employees/${project.tech_lead.id}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-2 text-xs font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
            >
              <Avatar name={project.tech_lead.name} avatarPath={project.tech_lead.avatar_path} size="sm" />
              {project.tech_lead.name}
            </Link>
          ) : null}
          {project.manager ? (
            <Link
              href={`/employees/${project.manager.id}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-2 text-xs text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-primary)]"
            >
              <Avatar name={project.manager.name} avatarPath={project.manager.avatar_path} size="sm" />
              {project.manager.name}
            </Link>
          ) : null}
          {!project.tech_lead && !project.manager ? (
            <span className="text-sm text-[color:var(--color-text-tertiary)]">-</span>
          ) : null}
        </div>
      </td>
      <td className="px-5 py-3">
        <ProjectActions project={project} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  )
}

export default function ProjectsPage() {
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
  const { data: teams } = useTeams({ limit: 100 })

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
  const teamCount = teams?.total || 0
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
      await deleteProject.mutateAsync(project.id)
    }
  }

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[color:var(--color-text-primary)]">Projects</h1>
            <p className="mt-2 font-medium text-[color:var(--color-text-tertiary)]">
              {totalProjects} projects across {teamCount} teams
            </p>
          </div>
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
        </header>

        <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-4 shadow-[var(--shadow-card)]">
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
          <div className="mt-4 flex flex-wrap gap-2">
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
            action={{ label: 'Create your first project', onClick: () => setModalOpen(true) }}
          />
        ) : null}

        {!isLoading && !isError && projects.length > 0 ? (
          <section className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left">
                <thead className="bg-[color:var(--color-surface-low)] text-[11px] font-black uppercase text-[color:var(--color-text-tertiary)]">
                  <tr>
                    <th className="px-5 py-4">Project Name</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Tech Stack</th>
                    <th className="px-5 py-4">Team</th>
                    <th className="px-5 py-4">Lead/Mgr</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-4 border-t border-[color:var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-[color:var(--color-text-tertiary)]">
                Showing {showingStart}-{showingEnd} of {totalProjects} results
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg bg-white p-2 text-[color:var(--color-text-secondary)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${
                      page === pageNumber
                        ? 'bg-[color:var(--color-primary)] text-white'
                        : 'text-[color:var(--color-text-secondary)] hover:bg-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg bg-white p-2 text-[color:var(--color-text-secondary)] disabled:cursor-not-allowed disabled:text-[color:var(--color-text-tertiary)]"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>
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
