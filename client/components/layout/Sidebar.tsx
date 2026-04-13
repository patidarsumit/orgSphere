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
import api from '@/lib/axios'
import { RootState } from '@/store'
import { clearAuth } from '@/store/slices/authSlice'

const organizationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/teams', label: 'Teams', icon: UsersRound },
]

const workspaceItems = [
  { href: '/my/dashboard', label: 'My Dashboard', icon: House },
  { href: '/my/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/my/notes', label: 'My Notes', icon: FileText },
]

const initialsFor = (name?: string) =>
  name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OS'

function NavSection({
  label,
  items,
}: {
  label: string
  items: Array<{ href: string; label: string; icon: typeof LayoutDashboard }>
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-semibold uppercase text-gray-400">{label}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
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

export function Sidebar() {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      router.push('/login')
    }
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-16 items-center gap-3 px-5">
        <span className="h-3 w-3 rounded-full bg-indigo-600" />
        <span className="text-lg font-semibold text-gray-900">OrgSphere</span>
      </div>

      <div className="flex-1 space-y-8 px-4 py-4">
        <NavSection label="Organization" items={organizationItems} />
        <NavSection label="My Workspace" items={workspaceItems} />
        {user?.role === 'admin' ? (
          <NavSection
            label="Admin"
            items={[{ href: '/settings', label: 'Settings', icon: Settings }]}
          />
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initialsFor(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs capitalize text-gray-500">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-900"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

