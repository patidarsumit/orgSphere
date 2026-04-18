'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, ChevronDown, PanelLeft, Search } from 'lucide-react'
import api from '@/lib/axios'
import { Avatar } from '@/components/shared/Avatar'
import { RootState } from '@/store'
import { clearAuth } from '@/store/slices/authSlice'
import { toggleSidebar } from '@/store/slices/uiSlice'

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

const pageNameFor = (pathname: string) => {
  if (pageNames[pathname]) {
    return pageNames[pathname]
  }

  const segment = pathname.split('/').filter(Boolean).at(-1)
  return segment ? segment.replaceAll('-', ' ') : 'Dashboard'
}

export function Header() {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const pageName = pageNameFor(pathname)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      router.push('/login')
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-gray-100 bg-white px-4 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 md:hidden"
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={20} />
        </button>
        <div className="truncate text-sm">
          <span className="text-gray-400">OrgSphere</span>
          <span className="px-2 text-gray-300">/</span>
          <span className="font-medium capitalize text-gray-900">{pageName}</span>
        </div>
      </div>

      <div className="hidden w-[360px] lg:block">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="search"
            placeholder="Search projects, people, teams..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-14 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-gray-400 ring-1 ring-gray-200">
            ⌘K
          </span>
        </label>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50"
          >
            <Avatar name={user?.name || 'OrgSphere User'} avatarPath={user?.avatar_path} size="sm" />
            <span className="hidden text-[13px] font-medium text-gray-900 sm:inline">
              {user?.name}
            </span>
            <ChevronDown className="text-gray-400" size={12} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-11 z-30 w-40 rounded-lg bg-white p-1 shadow-[var(--shadow-modal)] ring-1 ring-gray-100">
              <Link
                href="/my/dashboard"
                className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
