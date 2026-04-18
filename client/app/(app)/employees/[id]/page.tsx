'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  FolderKanban,
  Mail,
  MessageCircle,
  Pencil,
  Shield,
  Users,
} from 'lucide-react'
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal'
import { roleLabels } from '@/components/employees/constants'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDeactivateEmployee, useEmployee } from '@/hooks/useEmployees'
import { RootState } from '@/store'
import { Employee } from '@/types'

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-[120px] animate-pulse rounded-2xl bg-[color:var(--color-surface-highest)]" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 rounded-xl bg-[color:var(--color-surface-card)] p-6 shadow-sm lg:col-span-4">
          <div className="h-4 w-32 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          <div className="mt-8 space-y-3">
            <div className="h-3 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
          </div>
        </div>
        <div className="col-span-12 space-y-6 lg:col-span-8">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl bg-[color:var(--color-surface-card)] p-6 shadow-sm"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
              <div className="mt-4 h-3 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
              <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || 'O'
  const last = parts.length > 1 ? parts.at(-1)?.[0] : parts[0]?.[1]
  return `${first}${last || ''}`.toUpperCase()
}

function ProfileAvatar({ employee }: { employee: Employee }) {
  if (employee.avatar_path) {
    const imageUrl = employee.avatar_path.startsWith('http')
      ? employee.avatar_path
      : `http://localhost:4000/${employee.avatar_path}`

    return (
      <Image
        src={imageUrl}
        alt={employee.name}
        width={72}
        height={72}
        unoptimized
        className="h-[72px] w-[72px] rounded-xl object-cover ring-4 ring-white shadow-md"
      />
    )
  }

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-[color:var(--color-primary-light)] text-xl font-bold text-[color:var(--color-primary)] ring-4 ring-white shadow-md">
      {initialsFor(employee.name)}
    </div>
  )
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
        {eyebrow}
      </h3>
      {title ? (
        <h2 className="mt-1 text-xl font-bold text-[color:var(--color-text-primary)]">{title}</h2>
      ) : null}
    </div>
  )
}

export default function EmployeeDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deactivateEmployee = useDeactivateEmployee()
  const { data: employee, isLoading, isError } = useEmployee(params.id)
  const canEdit = currentUser?.role === 'admin' || currentUser?.id === params.id
  const canDeactivate = currentUser?.role === 'admin' && currentUser?.id !== params.id

  useEffect(() => {
    if (isError) {
      router.push('/employees')
    }
  }, [isError, router])

  const onDeactivate = async () => {
    await deactivateEmployee.mutateAsync(params.id)
    setConfirmOpen(false)
    router.push('/employees')
  }

  if (isLoading || !employee) {
    return <ProfileSkeleton />
  }

  return (
    <div className="relative -m-8 min-h-screen bg-[color:var(--color-surface)]">
      <div className="h-[120px] bg-[color:var(--color-surface-highest)]">
        <div className="flex items-center justify-between px-12 pt-8">
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--color-text-secondary)] backdrop-blur-md transition-colors hover:text-[color:var(--color-primary)]"
          >
            <ArrowLeft size={16} />
            Directory
          </Link>
          {canDeactivate ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl bg-red-50/90 px-4 py-2 text-sm font-semibold text-red-600 backdrop-blur-md transition-colors hover:bg-red-100"
            >
              Deactivate Account
            </button>
          ) : null}
        </div>
        <div className="absolute left-12 top-[82px] flex items-end gap-6">
          <div className="relative">
            <ProfileAvatar employee={employee} />
            <span
              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white ${
                employee.is_active ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>
          <div className="mb-1">
            <h1 className="text-xl font-semibold leading-tight text-[color:var(--color-text-primary)]">
              {employee.name}
            </h1>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              {roleLabels[employee.role]} • {employee.department || 'No department'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 px-12 pb-12 pt-16">
        <div className="col-span-12 space-y-8 lg:col-span-4">
          <section className="rounded-xl bg-[color:var(--color-surface-card)] p-6 shadow-sm">
            <SectionTitle eyebrow="Contact Information" />
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                    Email
                  </p>
                  <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                    {employee.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                    Department
                  </p>
                  <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                    {employee.department || 'No department'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[color:var(--color-text-tertiary)]">
                    Role
                  </p>
                  <p className="text-sm font-medium text-[color:var(--color-text-primary)]">
                    {roleLabels[employee.role]}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-[color:var(--color-surface-card)] p-6 shadow-sm">
            <SectionTitle eyebrow="Top Skills" />
            <div className="mt-4 flex flex-wrap gap-2">
              {employee.skills.length > 0 ? (
                employee.skills.map((skill, index) => (
                  <span
                    key={skill}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      index < 2
                        ? 'bg-[color:var(--color-primary-container)] text-[color:var(--color-on-primary-container)]'
                        : 'bg-[color:var(--color-surface-highest)] text-[color:var(--color-text-secondary)]'
                    }`}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[color:var(--color-text-tertiary)]">No skills added.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border-l-4 border-[color:var(--color-primary)] bg-[color:var(--color-surface-card)] p-6 shadow-sm">
            <SectionTitle eyebrow="Reporting To" />
            {employee.manager ? (
              <Link
                href={`/employees/${employee.manager.id}`}
                className="mt-4 flex items-center gap-4 rounded-xl transition-transform hover:scale-[1.01]"
              >
                <Avatar
                  name={employee.manager.name}
                  avatarPath={employee.manager.avatar_path}
                  size="lg"
                />
                <span>
                  <span className="block text-sm font-bold text-[color:var(--color-text-primary)]">
                    {employee.manager.name}
                  </span>
                  <span className="block text-xs text-[color:var(--color-text-tertiary)]">
                    {roleLabels[employee.manager.role]}
                  </span>
                </span>
                <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-low)] text-[color:var(--color-primary)]">
                  <MessageCircle size={14} />
                </span>
              </Link>
            ) : (
              <p className="mt-4 text-sm text-[color:var(--color-text-tertiary)]">
                No manager assigned.
              </p>
            )}
          </section>

          <section className="rounded-xl bg-[color:var(--color-surface-card)] p-6 shadow-sm">
            <SectionTitle eyebrow={`Direct Reports (${employee.direct_reports?.length || 0})`} />
            {employee.direct_reports && employee.direct_reports.length > 0 ? (
              <div className="mt-4 space-y-4">
                {employee.direct_reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/employees/${report.id}`}
                    className="flex items-center gap-3 rounded-xl transition-colors hover:bg-[color:var(--color-surface-low)]"
                  >
                    <Avatar name={report.name} avatarPath={report.avatar_path} size="md" />
                    <span>
                      <span className="block text-sm font-semibold leading-none text-[color:var(--color-text-primary)]">
                        {report.name}
                      </span>
                      <span className="block text-[10px] text-[color:var(--color-text-tertiary)]">
                        {roleLabels[report.role]}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No direct reports"
                description="Reporting relationships can be added from the edit profile form."
              />
            )}
          </section>
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section>
            <div className="mb-6 flex items-end justify-between">
              <SectionTitle eyebrow="Active Engagements" title="Assigned Projects" />
              <button className="flex items-center gap-1 text-sm font-semibold text-[color:var(--color-primary)] hover:underline">
                View Archive
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border-b-4 border-indigo-400 bg-[color:var(--color-surface-card)] p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[color:var(--color-primary)]">
                    <FolderKanban size={18} />
                  </div>
                  <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                    Phase 5
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[color:var(--color-text-primary)]">
                  Project assignments
                </h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  Assigned projects will appear after the projects module is connected.
                </p>
              </div>
              <div className="rounded-xl border-b-4 border-[color:var(--color-tertiary)] bg-[color:var(--color-surface-card)] p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[color:var(--color-tertiary)]">
                    <Users size={18} />
                  </div>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    Phase 4
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[color:var(--color-text-primary)]">
                  Team memberships
                </h4>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  Official team memberships will appear after the teams module is connected.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-[color:var(--color-surface-low)] p-8">
            <div className="mb-6 flex items-center justify-between">
              <SectionTitle eyebrow="Collaboration Hub" title="Official Teams" />
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-primary)] shadow-sm">
                Coming Soon
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Design Leadership', 'Enterprise Suite Core', 'Accessibility Taskforce'].map(
                (team) => (
                  <div
                    key={team}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-[color:var(--color-primary)]" />
                    <span className="text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {team}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-xl bg-[color:var(--color-surface-card)] p-8 shadow-sm">
            <SectionTitle eyebrow="Recent Contributions" />
            <div className="relative mt-6 space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-[color:var(--color-surface-low)]">
              {[1, 2].map((item) => (
                <div key={item} className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-primary-container)] ring-4 ring-white">
                    <Activity size={12} className="text-white" />
                  </div>
                  <p className="text-sm text-[color:var(--color-text-secondary)]">
                    Activity will appear after the activity module is connected.
                  </p>
                  <p className="mt-1 text-[10px] text-[color:var(--color-text-tertiary)]">
                    Phase 7
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {canEdit ? (
        <div className="fixed bottom-8 right-8 z-40">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="primary-gradient flex items-center gap-3 rounded-full px-6 py-4 text-sm font-bold tracking-tight text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Pencil size={18} />
            Edit Profile
          </button>
        </div>
      ) : null}

      <EmployeeFormModal
        open={editOpen}
        employee={employee}
        onClose={() => setEditOpen(false)}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate employee?"
        description="This will remove the employee from active directory views while keeping their record."
        dangerous
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onDeactivate}
      />
    </div>
  )
}
