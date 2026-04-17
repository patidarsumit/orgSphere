'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  PlusCircle,
  Rocket,
  Users,
} from 'lucide-react'
import { AvatarStack } from '@/components/shared/AvatarStack'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useRecentProjects } from '@/hooks/useProjects'
import api from '@/lib/axios'
import { RootState } from '@/store'
import { Project } from '@/types'

interface DashboardStats {
  totalProjects: number
  totalEmployees: number
  activeTeams: number
  myOpenTasks: number
}

interface DashboardStatCardProps {
  title: string
  value?: number
  label: string
  href: string
  tone: 'primary' | 'secondary' | 'tertiary' | 'priority'
  isLoading: boolean
  icon: typeof FolderKanban
}

interface ActivityItem {
  text: string
  highlight?: string
  time: string
  markerClassName: string
}

const activityItems: ActivityItem[] = [
  {
    text: 'Sarah M. updated documentation',
    highlight: 'CloudSync Architecture',
    time: '14 minutes ago',
    markerClassName: 'bg-[color:var(--color-primary)] ring-indigo-100',
  },
  {
    text: 'Critical bug detected',
    highlight: 'Neo-Banking Gateway',
    time: '1 hour ago',
    markerClassName: 'bg-red-500 ring-red-50',
  },
  {
    text: 'James Chen joined the team',
    highlight: 'Global Ops',
    time: '3 hours ago',
    markerClassName: 'bg-green-500 ring-green-50',
  },
  {
    text: 'New milestone achieved',
    highlight: 'Sprint 4 Complete',
    time: '5 hours ago',
    markerClassName: 'bg-blue-500 ring-blue-50',
  },
  {
    text: 'System backup completed successfully',
    time: 'Yesterday at 11:45 PM',
    markerClassName: 'bg-slate-400 ring-slate-100',
  },
  {
    text: 'Monthly reporting dashboard generated',
    time: 'Yesterday at 6:00 PM',
    markerClassName: 'bg-[color:var(--color-primary-container)] ring-indigo-100',
  },
]

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function DashboardStatCard({
  title,
  value,
  label,
  href,
  tone,
  isLoading,
  icon: Icon,
}: DashboardStatCardProps) {
  const isPriority = tone === 'priority'
  const cardClassName = isPriority
    ? 'primary-gradient text-white shadow-xl shadow-indigo-200'
    : 'bg-[color:var(--color-surface-card)] text-[color:var(--color-text-primary)] shadow-[var(--shadow-card)]'
  const iconClassName =
    tone === 'primary'
      ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)] group-hover:bg-[color:var(--color-primary)] group-hover:text-white'
      : tone === 'secondary'
        ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
        : tone === 'tertiary'
          ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
          : 'bg-white/20 text-white'

  return (
    <Link
      href={href}
      className={`group block rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2 ${cardClassName}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
        <span
          className={`text-right text-[10px] font-black uppercase ${
            isPriority ? 'text-white/75' : 'text-[color:var(--color-text-tertiary)]'
          }`}
        >
          {title}
        </span>
      </div>
      {isLoading || value === undefined ? (
        <div
          className={`h-9 w-20 animate-pulse rounded-md ${
            isPriority ? 'bg-white/20' : 'bg-[color:var(--color-surface-low)]'
          }`}
        />
      ) : (
        <p className="text-3xl font-black leading-none">{String(value).padStart(2, '0')}</p>
      )}
      <p
        className={`mt-3 flex items-center gap-1 text-xs ${
          isPriority ? 'text-white/80' : 'text-[color:var(--color-text-secondary)]'
        }`}
      >
        {tone === 'primary' ? <ArrowUpRight size={14} className="text-green-600" /> : null}
        {label}
      </p>
    </Link>
  )
}

function ProjectPreviewCard({ project }: { project: Project }) {
  const members = project.project_members.map((member) => ({
    name: member.user.name,
    avatarPath: member.user.avatar_path,
  }))

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-4 rounded-2xl bg-[color:var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2 sm:flex-row sm:items-center"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]">
        <FolderKanban size={30} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="font-bold text-[color:var(--color-text-primary)]">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tech_stack.slice(0, 3).map((tech) => (
            <TechStackChip key={tech} tech={tech} size="sm" />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <AvatarStack users={members} max={3} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-[color:var(--color-text-tertiary)]">
              Lead
            </span>
            <span className="text-xs font-bold text-[color:var(--color-text-primary)]">
              {project.tech_lead?.name || 'Unassigned'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function ActivityTimelineItem({
  item,
  isLast,
}: {
  item: ActivityItem
  isLast: boolean
}) {
  return (
    <li className="flex gap-4">
      <div className="relative shrink-0">
        <span className={`mt-1.5 block h-2.5 w-2.5 rounded-full ring-4 ${item.markerClassName}`} />
        {!isLast ? (
          <span className="absolute left-1/2 top-5 h-10 w-px -translate-x-1/2 bg-indigo-100" />
        ) : null}
      </div>
      <div className="min-w-0 pb-1">
        <p className="text-sm font-semibold leading-5 text-[color:var(--color-text-primary)]">
          {item.text}
          {item.highlight ? (
            <>
              {' '}
              <span className="text-[color:var(--color-primary)]">{item.highlight}</span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-[11px] font-medium text-[color:var(--color-text-tertiary)]">
          {item.time}
        </p>
      </div>
    </li>
  )
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { data: recentProjects = [], isLoading: projectsLoading } = useRecentProjects()
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats')
      return data
    },
  })

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <section className="w-full space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[color:var(--color-primary)]">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black text-[color:var(--color-text-primary)] sm:text-4xl">
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="mt-2 text-sm font-medium text-[color:var(--color-text-secondary)]">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="rounded-full bg-[color:var(--color-surface-card)] px-4 py-2 text-sm font-bold text-[color:var(--color-text-secondary)] shadow-[var(--shadow-card)]">
            Enterprise workspace
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            title="Total Projects"
            value={stats?.totalProjects}
            label="Tracked across teams"
            href="/projects"
            tone="primary"
            isLoading={isLoading}
            icon={FolderKanban}
          />
          <DashboardStatCard
            title="Total Employees"
            value={stats?.totalEmployees}
            label="Managed across departments"
            href="/employees"
            tone="secondary"
            isLoading={isLoading}
            icon={Users}
          />
          <DashboardStatCard
            title="Active Teams"
            value={stats?.activeTeams}
            label="Currently in production cycle"
            href="/teams"
            tone="tertiary"
            isLoading={isLoading}
            icon={Rocket}
          />
          <DashboardStatCard
            title="My Open Tasks"
            value={stats?.myOpenTasks}
            label="Task data arrives in a later phase"
            href="/my/tasks"
            tone="priority"
            isLoading={isLoading}
            icon={CheckSquare}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-10">
          <section className="space-y-6 lg:col-span-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[color:var(--color-text-primary)]">
                Recent Projects
              </h2>
              <Link
                href="/projects"
                className="text-sm font-bold text-[color:var(--color-primary)] hover:underline"
              >
                View All Projects
              </Link>
            </div>
            <div className="space-y-4">
              {projectsLoading
                ? [1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-36 animate-pulse rounded-2xl bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]"
                    />
                  ))
                : null}
              {!projectsLoading && recentProjects.length > 0
                ? recentProjects.map((project) => (
                    <ProjectPreviewCard key={project.id} project={project} />
                  ))
                : null}
              {!projectsLoading && recentProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create a project to see recent work here."
                />
              ) : null}
            </div>
          </section>

          <section className="space-y-6 lg:col-span-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[color:var(--color-text-primary)]">
                Activity Feed
              </h2>
              <span className="rounded-full bg-[color:var(--color-surface-card)] px-3 py-1 text-xs font-bold text-[color:var(--color-text-tertiary)]">
                Preview
              </span>
            </div>
            <ol className="max-h-none space-y-6 overflow-y-auto rounded-2xl bg-[color:var(--color-surface-container)] p-6 lg:max-h-[500px]">
              {activityItems.map((item, index) => (
                <ActivityTimelineItem
                  key={`${item.text}-${item.time}`}
                  item={item}
                  isLast={index === activityItems.length - 1}
                />
              ))}
            </ol>
          </section>
        </div>

        <section className="primary-gradient flex flex-col gap-6 rounded-2xl p-6 text-white shadow-2xl shadow-indigo-200 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Ready to expand the ecosystem?</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-indigo-100">
              Streamline your workflow with quick entry points for new assets and talent.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-indigo-900 transition-transform hover:-translate-y-0.5"
            >
              <PlusCircle size={18} />
              Add Project
            </Link>
            <Link
              href="/employees"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/15 px-5 py-3 text-sm font-black text-white ring-1 ring-white/30 transition-colors hover:bg-white/20"
            >
              <CheckCircle2 size={18} />
              Add Employee
            </Link>
          </div>
        </section>

        <p className="flex items-start gap-2 rounded-xl bg-[color:var(--color-surface-card)] p-4 text-xs font-medium text-[color:var(--color-text-secondary)] shadow-[var(--shadow-card)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          Activity details are UI previews until the activity module is connected.
        </p>
      </section>
    </div>
  )
}
