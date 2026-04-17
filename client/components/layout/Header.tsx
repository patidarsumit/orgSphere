'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, ChevronDown, PanelLeft, Search } from 'lucide-react'
import { ActivityFeedItem } from '@/components/activity/ActivityFeedItem'
import { Avatar } from '@/components/shared/Avatar'
import { useActivityFeed, useMarkAllRead, useUnreadCount } from '@/hooks/useActivity'
import api from '@/lib/axios'
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
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const pageName = pageNameFor(pathname)
  const { data: unreadData } = useUnreadCount()
  const { data: feed } = useActivityFeed(1, 8)
  const markAllRead = useMarkAllRead()
  const unreadCount = unreadData?.count ?? 0
  const notifications = feed?.data || []

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const toggleNotifications = () => {
    setBellOpen((current) => {
      const next = !current
      if (next && unreadCount > 0) {
        markAllRead.mutate()
      }
      return next
    })
  }

  const markReadAndClose = () => {
    markAllRead.mutate()
    setBellOpen(false)
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      router.push('/login')
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white px-4 md:px-8">
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
        <div ref={bellRef} className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={bellOpen}
          >
            <Bell size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 top-11 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl bg-white shadow-[var(--shadow-modal)] ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
                <div>
                  <h2 className="text-sm font-black text-gray-900">Notifications</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Latest workspace activity
                  </p>
                </div>
                {unreadCount > 0 ? (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-500">
                    Read
                  </span>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto p-3">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <ActivityFeedItem
                      key={item.id}
                      item={item}
                      compact
                      onSelect={() => setBellOpen(false)}
                    />
                  ))
                ) : (
                  <div className="rounded-lg bg-gray-50 p-6 text-center">
                    <p className="text-sm font-bold text-gray-900">No notifications yet</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Activity from the workspace will appear here.
                    </p>
                  </div>
                )}
              </div>
              {notifications.length > 0 ? (
                <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-3">
                  <button
                    type="button"
                    onClick={markReadAndClose}
                    className="rounded-lg px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Mark all read
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setBellOpen(false)}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
                  >
                    Open dashboard
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
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
