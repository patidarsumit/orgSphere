'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
  Building2,
  CheckCircle2,
  Database,
  FolderKanban,
  KeyRound,
  Shield,
  User,
  Users,
  UsersRound,
} from 'lucide-react'
import { roleLabels } from '@/components/employees/constants'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  useChangePassword,
  useSettingsOverview,
  useSettingsRoles,
  useUpdateProfileSettings,
  useUpdateSettingsRole,
} from '@/hooks/useSettings'
import { usePermissions } from '@/hooks/usePermissions'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { RootState } from '@/store'
import { setCredentials } from '@/store/slices/authSlice'
import { User as UserType, UserRole } from '@/types'

type SettingsTab = 'general' | 'roles' | 'account'

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'account', label: 'My Account', icon: KeyRound },
]

const roleOptions: UserRole[] = ['admin', 'hr', 'manager', 'tech_lead', 'employee', 'viewer']

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-gray-100 ${className}`}>
      {children}
    </section>
  )
}

function SettingsNav({ activeTab, onChange }: { activeTab: SettingsTab; onChange: (tab: SettingsTab) => void }) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-[240px]">
      <nav className="sticky top-24 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-bold transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)]'
                  : 'text-gray-500 hover:bg-indigo-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={17} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </span>
              {active ? <CheckCircle2 size={16} /> : null}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function GeneralTab() {
  const { data, isLoading } = useSettingsOverview()
  const snapshotItems: Array<{ label: string; value?: number; icon: typeof Users }> = [
    { label: 'Total Employees', value: data?.totalUsers, icon: Users },
    { label: 'Total Projects', value: data?.totalProjects, icon: FolderKanban },
    { label: 'Total Teams', value: data?.totalTeams, icon: UsersRound },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-[0_18px_44px_-24px_rgba(15,23,42,0.35)] ring-1 ring-gray-100 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-950">General Settings</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Manage the workspace identity and default regional preferences used across OrgSphere.
            </p>
          </div>
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-600">
            Enterprise Plan
          </span>
        </div>

        <div className="grid gap-6 py-7 lg:grid-cols-[220px_1fr]">
          <div>
            <h3 className="text-sm font-black text-gray-950">Company Identity</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">Keep naming and brand details consistent for every team.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Company Name</span>
              <input
                readOnly
                value="OrgSphere"
                className="mt-2 h-11 w-full rounded-lg bg-gray-50 px-3 text-sm font-semibold text-gray-700 outline-none ring-1 ring-gray-100"
              />
            </label>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Logo Upload</span>
              <div className="mt-2 flex min-h-11 items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-black text-white">OS</span>
                <button
                  type="button"
                  onClick={() => appToast.info('Logo upload is display-only for now')}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-white"
                >
                  Upload new logo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid gap-6 py-7 lg:grid-cols-[220px_1fr]">
          <div>
            <h3 className="text-sm font-black text-gray-950">Regional Settings</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">Set the defaults used for dates and operational reporting.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Default Timezone</span>
              <select className="mt-2 h-11 w-full rounded-lg bg-gray-50 px-3 text-sm font-semibold text-gray-700 outline-none ring-1 ring-gray-100">
                <option>Asia/Kolkata</option>
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-gray-400">Date Format</span>
              <select className="mt-2 h-11 w-full rounded-lg bg-gray-50 px-3 text-sm font-semibold text-gray-700 outline-none ring-1 ring-gray-100">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </label>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid gap-6 py-7 lg:grid-cols-[220px_1fr]">
          <div>
            <h3 className="text-sm font-black text-gray-950">Workspace Snapshot</h3>
            <p className="mt-1 text-sm leading-6 text-gray-500">Current organization totals from live settings data.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {snapshotItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-400">{label}</p>
                  <span className="rounded-lg bg-white p-2 text-indigo-600 ring-1 ring-gray-100">
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black text-gray-950">{isLoading ? '...' : value ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <button type="button" className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => appToast.info('Organization preferences are display-only for now')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <Shield size={22} />
            </span>
            <div>
              <h3 className="font-black text-gray-950">Security Audit Log</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">Recent workspace changes stay available for permission reviews.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <Database size={22} />
            </span>
            <div>
              <h3 className="font-black text-gray-950">Data Residency</h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">Workspace records are stored with the active organization environment.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function RolesTab() {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const { data: users = [], isLoading } = useSettingsRoles()
  const updateRole = useUpdateSettingsRole()

  const changeRole = async (user: UserType, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ userId: user.id, role })
      appToast.success('Role updated')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to update role'))
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-lg font-black text-gray-900">Roles & Permissions</h2>
        <p className="text-sm text-gray-500">Permissions are enforced at the API level.</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase text-gray-400"><tr><th className="py-3">Role</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th></tr></thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-gray-700">
              <tr><td className="py-3">Admin</td><td>All</td><td>All</td><td>All</td><td>All</td></tr>
              <tr><td className="py-3">HR</td><td>All</td><td>Employees</td><td>Employees</td><td>Employee deactivation</td></tr>
              <tr><td className="py-3">Manager</td><td>All</td><td>Projects</td><td>Own scope</td><td>-</td></tr>
              <tr><td className="py-3">Tech Lead</td><td>All</td><td>Tasks</td><td>Own scope</td><td>-</td></tr>
              <tr><td className="py-3">Employee</td><td>All</td><td>Tasks</td><td>Own scope</td><td>-</td></tr>
              <tr><td className="py-3">Viewer</td><td>All</td><td>-</td><td>Own workspace only</td><td>-</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-black text-gray-900">User Role Assignments</h2>
        <div className="mt-4 space-y-2">
          {isLoading ? <div className="h-52 animate-pulse rounded-lg bg-gray-100" /> : users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center">
              <Avatar name={user.name} avatarPath={user.avatar_path} size="sm" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-gray-900">{user.name}</p><p className="truncate text-xs text-gray-500">{user.email}</p></div>
              <StatusBadge status={roleLabels[user.role]} />
              <select value={user.role} disabled={user.id === currentUser?.id} onChange={(event) => void changeRole(user, event.target.value as UserRole)} className="h-9 rounded-lg bg-white px-3 text-sm font-semibold text-gray-700 outline-none ring-1 ring-gray-100 disabled:opacity-50">
                {roleOptions.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function AccountTab() {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)
  const accessToken = useSelector((state: RootState) => state.auth.accessToken)
  const updateProfile = useUpdateProfileSettings()
  const changePassword = useChangePassword()
  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const saveProfile = async () => {
    try {
      const saved = await updateProfile.mutateAsync({ name, department: department || null })
      if (accessToken) dispatch(setCredentials({ user: saved, accessToken }))
      appToast.success('Profile updated')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to update profile'))
    }
  }

  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      appToast.warning('New passwords do not match')
      return
    }
    try {
      await changePassword.mutateAsync({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      appToast.success('Password updated')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to update password'))
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <h2 className="text-lg font-black text-gray-900">Profile Information</h2>
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={user?.name || 'OrgSphere User'} avatarPath={user?.avatar_path} size="xl" />
          <div><p className="text-sm font-bold text-gray-900">{user?.email}</p><p className="text-xs text-gray-500">Photo changes are managed from the employee profile.</p></div>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm font-bold text-gray-600">Full Name</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-lg bg-gray-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block"><span className="text-sm font-bold text-gray-600">Email</span><input readOnly value={user?.email || ''} className="mt-2 h-11 w-full rounded-lg bg-gray-100 px-3 text-sm text-gray-500 outline-none" /></label>
          <label className="block"><span className="text-sm font-bold text-gray-600">Department</span><input value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2 h-11 w-full rounded-lg bg-gray-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" /></label>
          <button type="button" onClick={() => void saveProfile()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Save Changes</button>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-black text-gray-900">Change Password</h2>
        <div className="mt-5 space-y-4">
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" className="h-11 w-full rounded-lg bg-gray-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="h-11 w-full rounded-lg bg-gray-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="h-11 w-full rounded-lg bg-gray-50 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
          <button type="button" onClick={() => void savePassword()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Update Password</button>
        </div>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  useEffect(() => {
    if (user && !can.accessSettings) router.push('/dashboard')
  }, [can.accessSettings, router, user])

  const content = useMemo(() => {
    if (activeTab === 'general') return <GeneralTab />
    if (activeTab === 'roles') return <RolesTab />
    return <AccountTab />
  }, [activeTab])

  if (user && !can.accessSettings) return null

  return (
    <div className="-m-8 min-h-full bg-[#f7f8ff] p-5 sm:p-8">
      <header className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Workspace Admin</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Organization Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Configure workspace defaults, roles, and account controls for the team.
        </p>
      </header>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <SettingsNav activeTab={activeTab} onChange={setActiveTab} />
        <main className="min-w-0 flex-1">{content}</main>
      </div>
    </div>
  )
}
