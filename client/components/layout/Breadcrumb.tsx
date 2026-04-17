'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Employee, Project, Team } from '@/types'

interface Crumb {
  label: string
  href?: string
}

const staticLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  employees: 'Employees',
  teams: 'Teams',
  settings: 'Settings',
  my: 'My Workspace',
  tasks: 'My Tasks',
  notes: 'My Notes',
}

export function Breadcrumb() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs: Crumb[] = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`
    const parent = segments[index - 1]
    let label = staticLabels[segment] || segment.replaceAll('-', ' ')

    if (parent === 'projects') {
      label = queryClient.getQueryData<Project>(['project', segment])?.name || 'Project'
    }
    if (parent === 'employees') {
      label = queryClient.getQueryData<Employee>(['employees', segment])?.name || 'Employee'
    }
    if (parent === 'teams') {
      label = queryClient.getQueryData<Team>(['teams', segment])?.name || 'Team'
    }

    if (segments[0] === 'my' && segment === 'dashboard') {
      label = 'My Dashboard'
    }

    return { label, href: index === segments.length - 1 ? undefined : href }
  })

  if (crumbs.length === 0) {
    crumbs.push({ label: 'Dashboard' })
  }

  return (
    <nav className="flex min-w-0 items-center gap-2 truncate text-sm" aria-label="Breadcrumb">
      <span className="text-gray-400">OrgSphere</span>
      {crumbs.map((crumb) => (
        <span key={`${crumb.href || crumb.label}`} className="flex min-w-0 items-center gap-2">
          <span className="text-gray-300">/</span>
          {crumb.href ? (
            <Link href={crumb.href} className="truncate text-gray-400 hover:text-gray-900">
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate font-medium capitalize text-gray-900">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
