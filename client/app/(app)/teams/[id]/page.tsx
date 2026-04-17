'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  FolderKanban,
  Lock,
  Pencil,
  Shield,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { roleLabels } from '@/components/employees/constants'
import { AddMemberSearch } from '@/components/teams/AddMemberSearch'
import { TeamFormModal } from '@/components/teams/TeamFormModal'
import { formatDate, iconClassForTeam, initialsForTeam } from '@/components/teams/teamUtils'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useTeamProjects } from '@/hooks/useProjects'
import { useDeleteTeam, useRemoveTeamMember, useTeam } from '@/hooks/useTeams'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { RootState } from '@/store'
import { TeamMember } from '@/types'

interface RemoveTarget {
  id: string
  name: string
}

function TeamIcon({ name }: { name: string }) {
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black ${iconClassForTeam(
        name
      )}`}
    >
      {initialsForTeam(name)}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-8">
      <div className="space-y-8">
        <div className="h-28 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)]"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)]" />
        </div>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  canRemove,
  isCreator,
  onRemove,
}: {
  member: TeamMember
  canRemove: boolean
  isCreator: boolean
  onRemove: (member: TeamMember) => void
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-2xl bg-[color:var(--color-surface-card)] p-4 shadow-sm transition-colors hover:bg-white sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar name={member.name} avatarPath={member.avatar_path} size="lg" />
        <div className="min-w-0">
          <Link
            href={`/employees/${member.id}`}
            className="block truncate text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
          >
            {member.name}
          </Link>
          <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">
            {roleLabels[member.role]} • {member.department || 'No department'}
          </p>
        </div>
      </div>

      {isCreator ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[color:var(--color-primary)]">
          <Lock size={13} />
          Creator
        </span>
      ) : null}

      {canRemove ? (
        <button
          type="button"
          onClick={() => onRemove(member)}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 opacity-100 transition-opacity hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
        >
          Remove
        </button>
      ) : null}
    </article>
  )
}

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const { data: team, isLoading, isError } = useTeam(params.id)
  const { data: teamProjects = [], isLoading: projectsLoading } = useTeamProjects(params.id)
  const removeMember = useRemoveTeamMember(params.id)
  const deleteTeam = useDeleteTeam()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null)

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (isError || !team) {
    return (
      <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-8">
        <EmptyState
          icon={UsersRound}
          title="Team not found"
          description="The requested team could not be loaded."
          action={{ label: 'Back to Teams', onClick: () => router.push('/teams') }}
        />
      </div>
    )
  }

  const canEdit = currentUser?.role === 'admin' || currentUser?.id === team.created_by
  const canDelete = currentUser?.role === 'admin'
  const existingMemberIds = team.members.map((member) => member.id)
  const onConfirmRemove = async () => {
    if (!removeTarget) {
      return
    }
    try {
      await removeMember.mutateAsync(removeTarget.id)
      appToast.success(`${removeTarget.name} removed from team`)
      setRemoveTarget(null)
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to remove team member'))
    }
  }
  const onConfirmDelete = async () => {
    try {
      await deleteTeam.mutateAsync(team.id)
      appToast.success('Team deleted')
      setDeleteOpen(false)
      router.push('/teams')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to delete team'))
    }
  }

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <div className="space-y-8">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-surface-card)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-secondary)] shadow-sm transition-colors hover:text-[color:var(--color-primary)]"
        >
          <ArrowLeft size={16} />
          Teams
        </Link>

        <header className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <TeamIcon name={team.name} />
              <div>
                <h1 className="text-3xl font-bold text-[color:var(--color-text-primary)]">
                  {team.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  {team.description || 'A shared workspace for cross-functional collaboration.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Pencil size={16} />
                  Edit Team
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Delete Team
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="space-y-5 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[color:var(--color-text-primary)]">
                  Members
                </h2>
                <span className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[color:var(--color-primary)]">
                  {team.members.length}
                </span>
              </div>
              <AddMemberSearch teamId={team.id} existingMemberIds={existingMemberIds} />
            </div>

            <div className="space-y-3">
              {team.members.map((member) => {
                const isCreator = member.id === team.created_by
                const canRemove =
                  canEdit && !isCreator && currentUser?.id !== member.id && team.members.length > 1

                return (
                  <MemberRow
                    key={member.id}
                    member={member}
                    canRemove={canRemove}
                    isCreator={isCreator}
                    onRemove={(target) => setRemoveTarget(target)}
                  />
                )
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Team Info
              </h2>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                      Created by
                    </p>
                    {team.creator ? (
                      <Link
                        href={`/employees/${team.creator.id}`}
                        className="mt-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
                      >
                        <Avatar
                          name={team.creator.name}
                          avatarPath={team.creator.avatar_path}
                          size="sm"
                        />
                        {team.creator.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-[color:var(--color-text-secondary)]">Unknown</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                      Created
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {formatDate(team.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UsersRound size={18} className="text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                      Members
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {team.members.length} people
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                      Projects
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {projectsLoading
                        ? 'Loading...'
                        : `${teamProjects.length} ${teamProjects.length === 1 ? 'project' : 'projects'}`}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]">
                <FolderKanban size={22} />
              </div>
              <h2 className="mt-5 text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Assigned Projects
              </h2>
              {projectsLoading ? (
                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-xl bg-[color:var(--color-surface-low)]" />
                  ))}
                </div>
              ) : null}
              {!projectsLoading && teamProjects.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {teamProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="block rounded-xl bg-[color:var(--color-surface-low)] p-4 transition-transform hover:-translate-y-0.5 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-[color:var(--color-text-primary)]">
                          {project.name}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="mt-2 text-xs text-[color:var(--color-text-tertiary)]">
                        {project.start_date ? formatDate(project.start_date) : 'No start date'}
                        {project.manager ? ` • ${project.manager.name}` : ''}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.tech_stack.slice(0, 2).map((tech) => (
                          <TechStackChip key={tech} tech={tech} size="sm" />
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
              {!projectsLoading && teamProjects.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  No projects assigned to this team.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>

      <TeamFormModal open={editOpen} onClose={() => setEditOpen(false)} team={team} />
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove member?"
        description={
          removeTarget
            ? `${removeTarget.name} will lose access to this team workspace.`
            : 'This member will be removed from the team.'
        }
        dangerous
        onCancel={() => setRemoveTarget(null)}
        onConfirm={onConfirmRemove}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete team?"
        description="This team and its membership records will be removed."
        dangerous
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </div>
  )
}
