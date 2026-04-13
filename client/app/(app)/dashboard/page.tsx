'use client'

import { useSelector } from 'react-redux'
import { FolderKanban, ListTodo, Users, UsersRound } from 'lucide-react'
import { RootState } from '@/store'

const stats = [
  { label: 'Total Projects', value: '24', icon: FolderKanban },
  { label: 'Total Employees', value: '148', icon: Users },
  { label: 'Active Teams', value: '16', icon: UsersRound },
  { label: 'My Open Tasks', value: '7', icon: ListTodo },
]

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-indigo-600">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Welcome back, {user?.name}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <section
              key={stat.label}
              className="rounded-xl bg-white p-6 ring-1 ring-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon size={20} />
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

