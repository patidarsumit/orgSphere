'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  ArrowRight,
  CheckSquare,
  FileText,
  FolderKanban,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react'
import { extractTextFromTiptap, formatRelativeNoteDate } from '@/components/notes/noteUtils'
import { formatTaskDueDate, getDueTone } from '@/components/tasks/taskUtils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRecentNotes, useNotes } from '@/hooks/useNotes'
import { useUserProjects } from '@/hooks/useProjects'
import { useTasks, useTodayTasks, useUpdateTask } from '@/hooks/useTasks'
import api from '@/lib/axios'
import { RootState } from '@/store'

interface DashboardStats {
  totalProjects: number
  totalEmployees: number
  activeTeams: number
  myOpenTasks: number
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone,
  progress,
}: {
  label: string
  value: number
  subtitle: string
  icon: typeof CheckSquare
  tone: string
  progress?: number
}) {
  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--color-text-tertiary)]">
            {label}
          </p>
          <p className="mt-3 text-4xl font-black text-[color:var(--color-text-primary)]">
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={22} />
        </span>
      </div>
      <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">{subtitle}</p>
      {progress !== undefined ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-low)]">
          <span
            className="block h-full rounded-full bg-[color:var(--color-primary)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </section>
  )
}

export default function MyDashboardPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const updateTask = useUpdateTask()
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats')
      return data
    },
  })
  const { data: allTasks } = useTasks({ limit: 100 })
  const { data: todayTasks = [] } = useTodayTasks()
  const { data: notes } = useNotes({ limit: 100 })
  const { data: recentNotes = [] } = useRecentNotes()
  const { data: userProjects = [], isLoading: projectsLoading } = useUserProjects(currentUser?.id || '')

  const firstName = currentUser?.name.split(' ')[0] || 'there'
  const todayLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
  const totalTasks = allTasks?.total || 0
  const doneTasks = allTasks?.data.filter((task) => task.status === 'done').length || 0
  const openTasks = stats?.myOpenTasks ?? totalTasks - doneTasks
  const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <header className="mb-8 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-[var(--shadow-card)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-[color:var(--color-primary)]">{todayLabel}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--color-text-primary)]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            Your workspace is ready for focused execution.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--color-primary)] px-4 py-2 text-sm font-bold text-white">
          <Sparkles size={16} />
          Productivity up 12% this week
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          label="My Tasks"
          value={totalTasks}
          subtitle={`${openTasks} Active`}
          icon={CheckSquare}
          tone="bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]"
          progress={progress}
        />
        <StatCard
          label="My Projects"
          value={userProjects.length}
          subtitle="2 added since last month"
          icon={FolderKanban}
          tone="bg-teal-50 text-teal-600"
        />
        <StatCard
          label="My Notes"
          value={notes?.total || 0}
          subtitle="Quick capture active"
          icon={FileText}
          tone="bg-purple-50 text-purple-600"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="rounded-xl border border-[color:var(--color-border)] bg-white shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] p-5">
            <div>
              <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">
                My Tasks Today
              </h2>
              <p className="text-sm text-[color:var(--color-text-tertiary)]">
                Focused workflow for {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date())}
              </p>
            </div>
            <MoreHorizontal size={18} className="text-[color:var(--color-text-tertiary)]" />
          </div>
          <div className="divide-y divide-[color:var(--color-border)] p-2">
            {todayTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-[color:var(--color-surface-low)]">
                <button
                  type="button"
                  onClick={() => void updateTask.mutateAsync({ id: task.id, status: 'done' })}
                  className="h-5 w-5 shrink-0 rounded-full border border-[color:var(--color-border-strong)] hover:border-[color:var(--color-primary)]"
                  aria-label="Mark task done"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {task.title}
                  </p>
                  <p className="truncate text-xs text-[color:var(--color-text-tertiary)]">
                    {task.project?.name || 'Personal'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${getDueTone(task.due_date, task.status)}`}>
                  {formatTaskDueDate(task.due_date)}
                </span>
              </div>
            ))}
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-[color:var(--color-text-secondary)]">
                No tasks for today. Enjoy the clear runway.
              </div>
            ) : null}
          </div>
          <Link
            href="/my/tasks"
            className="flex items-center justify-center gap-2 border-t border-[color:var(--color-border)] p-4 text-sm font-bold text-[color:var(--color-primary)]"
          >
            View all tasks <ArrowRight size={15} />
          </Link>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">
              My Notes <span className="font-medium text-[color:var(--color-text-tertiary)]">(Recent)</span>
            </h2>
            <Link href="/my/notes" className="text-sm font-bold text-[color:var(--color-primary)]">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentNotes.map((note, index) => (
              <Link
                key={note.id}
                href={`/my/notes?note=${note.id}`}
                className={`block rounded-lg border border-[color:var(--color-border)] bg-white p-3 transition-colors hover:bg-[color:var(--color-surface-low)] ${
                  index === 0 ? 'border-l-4 border-l-[color:var(--color-primary)]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[color:var(--color-primary-light)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--color-primary)]">
                    {note.tags[0] || 'Note'}
                  </span>
                  <span className="text-xs text-[color:var(--color-text-tertiary)]">
                    {formatRelativeNoteDate(note.updated_at)}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {note.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--color-text-secondary)]">
                  {extractTextFromTiptap(note.content).slice(0, 80) || 'Blank note'}
                </p>
              </Link>
            ))}
            {recentNotes.length === 0 ? (
              <div className="rounded-lg bg-[color:var(--color-surface-low)] p-6 text-center">
                <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">No notes yet</p>
                <Link href="/my/notes" className="mt-2 inline-flex text-sm font-bold text-[color:var(--color-primary)]">
                  + Create note
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[color:var(--color-text-primary)]">Active Projects</h2>
            <p className="text-sm text-[color:var(--color-text-tertiary)]">Projects where you are assigned.</p>
          </div>
          <Link href="/projects" className="text-sm font-bold text-[color:var(--color-primary)]">
            Browse all projects
          </Link>
        </div>
        {projectsLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-xl bg-[color:var(--color-surface-low)]" />
            ))}
          </div>
        ) : userProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {userProjects.map((membership) => (
              <Link
                key={membership.id}
                href={`/projects/${membership.project.id}`}
                className="rounded-xl border border-[color:var(--color-border)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-[color:var(--color-text-primary)]">
                    {membership.project.name}
                  </h3>
                  <StatusBadge status={membership.project.status} />
                </div>
                <p className="mt-4 text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                  {membership.project.team?.name || 'No team'}
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--color-primary)]">
                  {membership.role}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-[color:var(--color-surface-low)] p-8 text-center text-sm text-[color:var(--color-text-secondary)]">
            You have not been assigned to any projects yet.
          </div>
        )}
      </section>
    </div>
  )
}
