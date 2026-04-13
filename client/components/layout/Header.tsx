'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Bell, Search } from 'lucide-react'
import { RootState } from '@/store'

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/employees': 'Employees',
  '/teams': 'Teams',
  '/my/dashboard': 'My Dashboard',
  '/my/tasks': 'My Tasks',
  '/my/notes': 'My Notes',
  '/settings': 'Settings',
}

const initialsFor = (name?: string) =>
  name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OS'

export function Header() {
  const pathname = usePathname()
  const user = useSelector((state: RootState) => state.auth.user)

  const pageName = useMemo(() => {
    if (pageNames[pathname]) {
      return pageNames[pathname]
    }

    const segment = pathname.split('/').filter(Boolean).at(-1)
    return segment ? segment.replaceAll('-', ' ') : 'Dashboard'
  }, [pathname])

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-gray-100 bg-white px-6">
      <div className="w-56">
        <p className="text-sm font-semibold capitalize text-gray-900">{pageName}</p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="search"
            placeholder="Search projects, people, teams..."
            className="h-10 w-full rounded-lg bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none ring-1 ring-gray-100 transition focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </label>
      </div>

      <div className="flex w-56 items-center justify-end gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
          {initialsFor(user?.name)}
        </div>
      </div>
    </header>
  )
}

