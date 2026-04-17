'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  Mail,
  MessageSquareText,
  Pencil,
  Share2,
  StickyNote,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { roleLabels } from '@/components/employees/constants'
import { AddProjectMemberSearch } from '@/components/projects/AddProjectMemberSearch'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { formatProjectDate } from '@/components/projects/projectUtils'
import { Avatar } from '@/components/shared/Avatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import {
  useProject,
  useRemoveProjectMember,
} from '@/hooks/useProjects'
import { RootState } from '@/store'
import { Project } from '@/types'

type ProjectTab = 'overview' | 'team' | 'tasks' | 'notes' | 'activity'

const tabs: Array<{ id: ProjectTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity' },
]

function DetailSkeleton() {
  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-3xl bg-[color:var(--color-surface-card)]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-3xl bg-[color:var(--color-surface-card)] lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-[2rem] bg-[color:var(--color-surface-card)]" />
        </div>
      </div>
    </div>
  )
}

function PersonLink({
  label,
  person,
}: {
  label: string
  person: Project['manager'] | Project['tech_lead']
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
        {label}
      </p>
      {person ? (
        <Link
          href={`/employees/${person.id}`}
          className="mt-1 inline-flex text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
        >
          {person.name}
        </Link>
      ) : (
        <p className="mt-2 text-sm text-[color:var(--color-text-tertiary)]">-</p>
      )}
    </div>
  )
}

function ProjectInfoCard({ project }: { project: Project }) {
  return (
    <aside className="rounded-[2rem] border border-[color:var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
      <h2 className="flex items-center gap-3 text-xl font-black tracking-tight text-[color:var(--color-text-primary)]">
        <FolderKanban size={22} className="text-[color:var(--color-primary)]" />
        Project Info
      </h2>
      <div className="mt-6 space-y-6">
        <PersonLink label="Project Manager" person={project.manager} />
        <PersonLink label="Tech Lead" person={project.tech_lead} />
        <div>
          <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
            Start Date
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-primary)]">
            <CalendarDays size={16} className="text-[color:var(--color-primary)]" />
            {formatProjectDate(project.start_date)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
            Team
          </p>
          {project.team ? (
            <Link
              href={`/teams/${project.team.id}`}
              className="mt-1 inline-flex text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
            >
              {project.team.name}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--color-text-tertiary)]">-</p>
          )}
        </div>
      </div>
    </aside>
  )
}

function OverviewTab({ project, onTeamTab }: { project: Project; onTeamTab: () => void }) {
  const coreMembers = project.project_members.slice(0, 4)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--color-text-primary)]">Project Mission</h2>
          <p className="mt-5 rounded-2xl bg-[color:var(--color-surface-low)] p-6 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            {project.description || 'No mission statement has been added for this project.'}
          </p>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--color-text-primary)]">Tech Stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack.length > 0 ? (
              project.tech_stack.map((tech) => <TechStackChip key={tech} tech={tech} />)
            ) : (
              <p className="text-sm text-[color:var(--color-text-tertiary)]">No technologies listed.</p>
            )}
          </div>
        </section>
        <section className="rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight text-[color:var(--color-text-primary)]">Core Team</h2>
            <button
              type="button"
              onClick={onTeamTab}
              className="text-sm font-bold text-[color:var(--color-primary)] hover:underline"
            >
              View All Members
            </button>
          </div>
          {coreMembers.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {coreMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/employees/${member.user.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-low)] p-4 transition-all hover:border-[color:var(--color-primary)]/20 hover:bg-white hover:shadow-[0_18px_35px_-26px_rgba(53,37,205,0.7)]"
                >
                  <Avatar name={member.user.name} avatarPath={member.user.avatar_path} size="lg" />
                  <span>
                    <span className="block text-sm font-bold text-[color:var(--color-text-primary)]">
                      {member.user.name}
                    </span>
                    <span className="block text-xs text-[color:var(--color-text-tertiary)]">
                      {member.role}
                    </span>
                  </span>
                  <Mail size={18} className="ml-auto text-[color:var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--color-text-tertiary)]">
              No team members assigned.
            </p>
          )}
        </section>
      </div>
      <ProjectInfoCard project={project} />
    </div>
  )
}

function TeamTab({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const removeMember = useRemoveProjectMember(project.id)
  const existingMemberIds = project.project_members.map((member) => member.user_id)
  const activeDepartments = Array.from(
    new Set(project.project_members.map((member) => member.user.department).filter(Boolean))
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[color:var(--color-text-primary)]">Project Team</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
            {project.project_members.length} active collaborators
          </p>
        </div>
        {canEdit ? <AddProjectMemberSearch projectId={project.id} existingMemberIds={existingMemberIds} /> : null}
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {project.project_members.map((member) => (
          <article
            key={member.id}
            className="group relative overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)] transition-all hover:border-indigo-100/70 hover:shadow-[0_24px_45px_-35px_rgba(30,41,59,0.75)]"
          >
            <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-indigo-50/70 transition-transform group-hover:scale-150" />
            <div className="relative z-10 flex flex-col items-center">
              <Link href={`/employees/${member.user.id}`} className="rounded-full">
                <Avatar name={member.user.name} avatarPath={member.user.avatar_path} size="xl" />
              </Link>
              <Link
                href={`/employees/${member.user.id}`}
                className="mt-4 max-w-full truncate text-lg font-black text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
              >
                {member.user.name}
              </Link>
              <p className="mt-1 text-xs font-black uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                {roleLabels[member.user.role]}
              </p>
              <div className="my-6 grid w-full grid-cols-2 gap-2">
                <div className="rounded-lg bg-[color:var(--color-surface-low)] p-2">
                  <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
                    Role
                  </p>
                  <p className="truncate text-xs font-bold text-[color:var(--color-text-primary)]">
                    {member.role}
                  </p>
                </div>
                <div className="rounded-lg bg-[color:var(--color-surface-low)] p-2">
                  <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
                    Dept
                  </p>
                  <p className="truncate text-xs font-bold text-[color:var(--color-text-primary)]">
                    {member.user.department || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between border-t border-indigo-50 pt-4">
                <Link
                  href={`/employees/${member.user.id}`}
                  className="text-xs font-bold text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-primary)]"
                >
                  View Profile
                </Link>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => void removeMember.mutateAsync(member.user_id)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {canEdit ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-surface-low)] text-[color:var(--color-primary)]">
              <UserPlus size={30} />
            </span>
            <h3 className="mt-4 text-lg font-black text-[color:var(--color-text-primary)]">Invite Collaborator</h3>
            <p className="mt-1 text-xs font-medium text-[color:var(--color-text-tertiary)]">
              Use the search above to expand the project team.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white lg:col-span-2">
          <UsersRound size={220} className="absolute -bottom-14 -right-12 text-white/5" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black">Team Composition</h3>
            <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Active Members</p>
                <p className="mt-1 text-5xl font-black">{project.project_members.length}</p>
              </div>
              <div className="flex h-32 flex-1 items-end gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <span
                    key={index}
                    className="w-full rounded-t-lg bg-[color:var(--color-primary-light)]"
                    style={{ height: `${[80, 60, 42, 90, 32][index]}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              {activeDepartments.slice(0, 3).map((department) => (
                <span key={department} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className="h-3 w-3 rounded-full bg-[color:var(--color-primary-light)]" />
                  {department}
                </span>
              ))}
              {activeDepartments.length === 0 ? (
                <span className="text-xs font-medium text-slate-300">Departments are not assigned yet</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[color:var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-black text-[color:var(--color-text-primary)]">Team Health</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            The team roster is ready for project delivery tracking.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--color-surface-low)] p-4">
              <span className="text-sm font-bold text-[color:var(--color-text-primary)]">Coverage</span>
              <span className="text-sm font-black text-[color:var(--color-primary)]">
                {Math.min(project.project_members.length * 12, 96)}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--color-surface-low)] p-4">
              <span className="text-sm font-bold text-[color:var(--color-text-primary)]">Departments</span>
              <span className="text-sm font-black text-[color:var(--color-primary)]">
                {activeDepartments.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {project.project_members.length === 0 ? (
        <p className="text-sm text-[color:var(--color-text-tertiary)]">No team members assigned.</p>
      ) : null}
    </div>
  )
}

function ComingSoon({ icon: Icon, title, description }: { icon: typeof FolderKanban; title: string; description: string }) {
  return (
    <section className="rounded-3xl bg-[color:var(--color-surface-card)] p-10 shadow-[var(--shadow-card)]">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]">
          <Icon size={26} />
        </span>
        <h2 className="mt-5 text-xl font-black text-[color:var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">{description}</p>
      </div>
    </section>
  )
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const { data: project, isLoading, isError } = useProject(params.id)
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError || !project) {
    return (
      <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-8">
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="The requested project could not be loaded."
          action={{ label: 'Back to Projects', onClick: () => router.push('/projects') }}
        />
      </div>
    )
  }

  const canEdit =
    currentUser?.role === 'admin' ||
    currentUser?.id === project.manager_id ||
    currentUser?.id === project.tech_lead_id

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="space-y-8">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
        >
          <ArrowLeft size={16} />
          Projects
        </Link>

        <header className="rounded-3xl bg-white p-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <StatusBadge status={project.status} />
              <h1 className="text-5xl font-black tracking-tight text-[color:var(--color-text-primary)]">
                {project.name}
              </h1>
              <p className="max-w-4xl text-lg leading-8 text-[color:var(--color-text-secondary)]">
                {project.description || 'No project description has been added.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-surface-low)] px-6 py-3 text-sm font-bold text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-primary-light)] hover:text-[color:var(--color-primary)]"
              >
                <Share2 size={16} />
                Share
              </button>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-16px_rgba(53,37,205,0.8)]"
                >
                  <Pencil size={16} />
                  Edit Project
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <nav className="sticky top-16 z-20 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-[var(--shadow-card)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[color:var(--color-primary)] text-white shadow-[0_14px_30px_-18px_rgba(53,37,205,0.8)]'
                  : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)] hover:text-[color:var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' ? (
          <OverviewTab project={project} onTeamTab={() => setActiveTab('team')} />
        ) : null}
        {activeTab === 'team' ? <TeamTab project={project} canEdit={canEdit} /> : null}
        {activeTab === 'tasks' ? (
          <ComingSoon icon={UsersRound} title="Tasks arrive in Phase 6" description="Project tasks and sprint execution will connect here in the next phase." />
        ) : null}
        {activeTab === 'notes' ? (
          <ComingSoon icon={StickyNote} title="Notes arrive in Phase 6" description="Project notes and decision logs will live here soon." />
        ) : null}
        {activeTab === 'activity' ? (
          <ComingSoon icon={MessageSquareText} title="Activity arrives in Phase 7" description="Audit history and collaboration events will appear here later." />
        ) : null}
      </div>

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
    </div>
  )
}
