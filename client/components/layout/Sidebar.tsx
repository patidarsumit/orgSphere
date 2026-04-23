'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
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
import { OrgSphereMark } from '@/components/shared/OrgSphereMark'
import { usePermissions } from '@/hooks/usePermissions'
import { RootState } from '@/store'
import { clearAuth } from '@/store/slices/authSlice'
import { setSidebarCollapsed, setSidebarOpen } from '@/store/slices/uiSlice'

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

const SIDEBAR_COLLAPSED_KEY = 'orgsphere.sidebarCollapsed'

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
      {label}
    </span>
  )
}

function NavSection({
  label,
  items,
  onNavigate,
  collapsed = false,
}: {
  label: string
  items: NavItem[]
  onNavigate: () => void
  collapsed?: boolean
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-2">
      {collapsed ? (
        <p
          className="overflow-hidden whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-wide opacity-0"
          aria-hidden="true"
        >
          {label}
        </p>
      ) : (
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      )}
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
              aria-label={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex h-9 items-center rounded-lg text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {isActive ? (
                <span className="absolute left-0 h-5 w-0.5 rounded-full bg-indigo-600" />
              ) : null}
              <Icon size={16} />
              {collapsed ? null : item.label}
              {collapsed ? <Tooltip label={item.label} /> : null}
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
  collapsed = false,
  onToggleCollapsed,
}: {
  user: UserResponse | null
  onLogout: () => void
  onNavigate: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}) {
  const CollapseIcon = collapsed ? ChevronRight : ChevronLeft
  const { can } = usePermissions()

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-gray-100 bg-white transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[76px]' : 'w-[240px]'
      }`}
    >
      {onToggleCollapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="group absolute -right-3 top-[82px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-indigo-200 hover:text-indigo-600 md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CollapseIcon size={14} />
          <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} />
        </button>
      ) : null}

      <div className={collapsed ? 'px-0' : 'px-5'}>
        <div className={`flex h-16 items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <OrgSphereMark className="h-7 w-7" />
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="block text-lg font-semibold leading-5 text-gray-900">
                OrgSphere
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Enterprise Space
              </span>
            </span>
          )}
        </div>
      </div>

      <div className={`flex-1 space-y-8 py-5 ${collapsed ? 'px-3' : 'px-4'}`}>
        <NavSection
          label="Organization"
          items={organizationItems}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <NavSection
          label="My Workspace"
          items={workspaceItems}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        {can.accessSettings ? (
          <NavSection
            label="Admin"
            items={[{ href: '/settings', label: 'Settings', icon: Settings }]}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ) : null}
      </div>

      <div className={`border-t border-gray-100 ${collapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'gap-3'}`}>
          <Avatar name={user?.name || 'OrgSphere User'} avatarPath={user?.avatar_path} size="sm" />
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-gray-900">{user?.name}</p>
              <p className="truncate text-[11px] capitalize text-gray-400">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="group relative rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Log out"
          >
            <LogOut size={16} />
            {collapsed ? <Tooltip label="Log out" /> : null}
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
  const sidebarCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      router.push('/login')
    }
  }

  const closeSidebar = () => dispatch(setSidebarOpen(false))
  const handleToggleCollapsed = () => {
    const nextValue = !sidebarCollapsed
    dispatch(setSidebarCollapsed(nextValue))

    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextValue))
    } catch {
      // Ignore storage failures so the sidebar remains usable.
    }
  }

  useEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)

      if (savedValue === 'true' || savedValue === 'false') {
        dispatch(setSidebarCollapsed(savedValue === 'true'))
      }
    } catch {
      // Ignore storage failures so the default expanded sidebar still renders.
    }
  }, [dispatch])

  useEffect(() => {
    const syncMobileSidebar = () => {
      if (window.innerWidth < 768) {
        dispatch(setSidebarOpen(false))
      }
    }

    syncMobileSidebar()
    window.addEventListener('resize', syncMobileSidebar)
    return () => window.removeEventListener('resize', syncMobileSidebar)
  }, [dispatch])

  return (
    <>
      <div className="hidden md:block">
        <SidebarPanel
          user={user}
          onLogout={handleLogout}
          onNavigate={closeSidebar}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />
      </div>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-gray-900/40"
            onClick={closeSidebar}
          />
          <div className="absolute inset-y-0 left-0 translate-x-0 shadow-[var(--shadow-modal)] transition-transform duration-200 ease-in-out">
            <SidebarPanel user={user} onLogout={handleLogout} onNavigate={closeSidebar} />
          </div>
        </div>
      ) : null}
    </>
  )
}
