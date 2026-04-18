'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
  CheckSquare,
  FileText,
  FolderKanban,
  House,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UsersRound,
} from 'lucide-react'
import { UserResponse } from '@orgsphere/schemas'
import api from '@/lib/axios'
import { Avatar } from '@/components/shared/Avatar'
import { RootState } from '@/store'
import { clearAuth } from '@/store/slices/authSlice'
import { setSidebarOpen } from '@/store/slices/uiSlice'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const organizationItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/teams', label: 'Teams', icon: UsersRound },
]

const workspaceItems: NavItem[] = [
  { href: '/my/dashboard', label: 'My Dashboard', icon: House },
  { href: '/my/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/my/notes', label: 'My Notes', icon: FileText },
]

function NavSection({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: NavItem[]
  onNavigate: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {isActive ? (
                <span className="absolute left-0 h-5 w-0.5 rounded-full bg-indigo-600" />
              ) : null}
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function SidebarPanel({
  user,
  onLogout,
  onNavigate,
}: {
  user: UserResponse | null
  onLogout: () => void
  onNavigate: () => void
}) {
  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 rounded-full bg-indigo-600" />
          <span className="text-lg font-semibold text-gray-900">OrgSphere</span>
        </div>
        <p className="ml-9 mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Enterprise Space
        </p>
      </div>

      <div className="flex-1 space-y-8 px-4 py-5">
        <NavSection label="Organization" items={organizationItems} onNavigate={onNavigate} />
        <NavSection label="My Workspace" items={workspaceItems} onNavigate={onNavigate} />
        {user?.role === 'admin' ? (
          <NavSection
            label="Admin"
            items={[{ href: '/settings', label: 'Settings', icon: Settings }]}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name || 'OrgSphere User'} avatarPath={user?.avatar_path} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-[11px] capitalize text-gray-400">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function Sidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      router.push('/login')
    }
  }

  const closeSidebar = () => dispatch(setSidebarOpen(false))

  return (
    <>
      <div className="hidden md:block">
        <SidebarPanel user={user} onLogout={handleLogout} onNavigate={closeSidebar} />
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-gray-900/40"
            onClick={closeSidebar}
          />
          <div className="absolute inset-y-0 left-0 shadow-[var(--shadow-modal)]">
            <SidebarPanel user={user} onLogout={handleLogout} onNavigate={closeSidebar} />
          </div>
        </div>
      ) : null}
    </>
  )
}
