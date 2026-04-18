'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { CheckSquare, FolderKanban, Users, UsersRound } from 'lucide-react'
import api from '@/lib/axios'
import { StatCard } from '@/components/shared/StatCard'
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

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user)
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats')
      return data
    },
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects}
          icon={FolderKanban}
          isLoading={isLoading}
          accentColor="indigo"
        />
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees}
          icon={Users}
          isLoading={isLoading}
          accentColor="teal"
        />
        <StatCard
          title="Active Teams"
          value={stats?.activeTeams}
          icon={UsersRound}
          isLoading={isLoading}
          accentColor="purple"
        />
        <StatCard
          title="My Open Tasks"
          value={stats?.myOpenTasks}
          icon={CheckSquare}
          isLoading={isLoading}
          accentColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-gray-50" />
            ))}
            <p className="pt-2 text-center text-xs text-gray-400">
              Project data available after Phase 5
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Activity Feed</h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex gap-3">
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gray-200" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-50" />
              </div>
            ))}
            <p className="pt-2 text-center text-xs text-gray-400">
              Activity feed available after Phase 7
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-xl bg-indigo-600 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Ready to expand the ecosystem?</h2>
          <p className="mt-1 text-sm text-indigo-200">
            Streamline your workflow with quick entry points.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/projects"
            className="rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            + Add Project
          </Link>
          <Link
            href="/employees"
            className="rounded-lg border border-indigo-400 bg-indigo-500 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            + Add Employee
          </Link>
        </div>
      </div>
    </div>
  )
}
