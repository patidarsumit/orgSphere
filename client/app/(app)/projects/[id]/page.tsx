'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  MessageSquareText,
  Pencil,
  Share2,
  StickyNote,
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
  useUpdateProjectMemberRole,
} from '@/hooks/useProjects'
import { RootState } from '@/store'
import { Project, ProjectMember } from '@/types'

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
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)] lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)]" />
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
          className="mt-2 flex items-center gap-3 rounded-xl p-2 hover:bg-[color:var(--color-surface-low)]"
        >
          <Avatar name={person.name} avatarPath={person.avatar_path} size="md" />
          <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
            {person.name}
          </span>
        </Link>
      ) : (
        <p className="mt-2 text-sm text-[color:var(--color-text-tertiary)]">-</p>
      )}
    </div>
  )
}

function ProjectInfoCard({ project }: { project: Project }) {
  return (
    <aside className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
      <h2 className="text-sm font-black text-[color:var(--color-text-primary)]">Project Info</h2>
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
              className="mt-2 inline-flex rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-sm font-bold text-[color:var(--color-primary)]"
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
        <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">Project Mission</h2>
          <p className="mt-4 rounded-xl bg-[color:var(--color-surface-low)] p-4 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            {project.description || 'No mission statement has been added for this project.'}
          </p>
        </section>
        <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">Tech Stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack.length > 0 ? (
              project.tech_stack.map((tech) => <TechStackChip key={tech} tech={tech} />)
            ) : (
              <p className="text-sm text-[color:var(--color-text-tertiary)]">No technologies listed.</p>
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">Core Team</h2>
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
                  className="flex items-center gap-4 rounded-xl bg-[color:var(--color-surface-low)] p-4 hover:bg-white"
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

function MemberRoleEditor({
  member,
  canEdit,
  projectId,
}: {
  member: ProjectMember
  canEdit: boolean
  projectId: string
}) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(member.role)
  const updateRole = useUpdateProjectMemberRole(projectId)

  const saveRole = async () => {
    if (role.trim() && role.trim() !== member.role) {
      await updateRole.mutateAsync({ userId: member.user_id, role: role.trim() })
    }
    setEditing(false)
  }

  if (!canEdit || !editing) {
    return (
      <button
        type="button"
        onClick={() => canEdit && setEditing(true)}
        className="text-left text-xs font-semibold text-[color:var(--color-primary)]"
      >
        {member.role}
      </button>
    )
  }

  return (
    <input
      value={role}
      onChange={(event) => setRole(event.target.value)}
      onBlur={() => void saveRole()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          void saveRole()
        }
      }}
      autoFocus
      className="h-8 rounded-lg border border-[color:var(--color-border)] px-2 text-xs outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
    />
  )
}

function TeamTab({ project, canEdit }: { project: Project; canEdit: boolean }) {
  const removeMember = useRemoveProjectMember(project.id)
  const existingMemberIds = project.project_members.map((member) => member.user_id)

  return (
    <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">Project Team</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
            {project.project_members.length} people assigned
          </p>
        </div>
        {canEdit ? <AddProjectMemberSearch projectId={project.id} existingMemberIds={existingMemberIds} /> : null}
      </div>
      <div className="mt-6 space-y-3">
        {project.project_members.map((member) => (
          <article
            key={member.id}
            className="group flex flex-col gap-4 rounded-xl bg-[color:var(--color-surface-low)] p-4 sm:flex-row sm:items-center"
          >
            <Link href={`/employees/${member.user.id}`} className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar name={member.user.name} avatarPath={member.user.avatar_path} size="lg" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[color:var(--color-text-primary)]">
                  {member.user.name}
                </span>
                <span className="block text-xs text-[color:var(--color-text-tertiary)]">
                  {roleLabels[member.user.role]} - {member.user.department || 'No department'}
                </span>
              </span>
            </Link>
            <MemberRoleEditor member={member} canEdit={canEdit} projectId={project.id} />
            {canEdit ? (
              <button
                type="button"
                onClick={() => void removeMember.mutateAsync(member.user_id)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 opacity-100 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
              >
                Remove from project
              </button>
            ) : null}
          </article>
        ))}
        {project.project_members.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-tertiary)]">No team members assigned.</p>
        ) : null}
      </div>
    </section>
  )
}

function ComingSoon({ icon: Icon, title, description }: { icon: typeof FolderKanban; title: string; description: string }) {
  return (
    <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-10 shadow-[var(--shadow-card)]">
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
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-secondary)] shadow-sm hover:text-[color:var(--color-primary)]"
        >
          <ArrowLeft size={16} />
          Projects
        </Link>

        <header className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <StatusBadge status={project.status} />
              <h1 className="mt-4 text-3xl font-black text-[color:var(--color-text-primary)]">
                {project.name}
              </h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-[color:var(--color-text-secondary)]">
                {project.description || 'No project description has been added.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-surface-low)] px-4 py-2 text-sm font-bold text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]"
              >
                <Share2 size={16} />
                Share
              </button>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-4 py-2 text-sm font-bold text-white"
                >
                  <Pencil size={16} />
                  Edit Project
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <nav className="sticky top-16 z-20 flex gap-2 overflow-x-auto rounded-2xl bg-[color:var(--color-surface-card)] p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[color:var(--color-primary)] text-white'
                  : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'
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
