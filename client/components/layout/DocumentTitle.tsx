'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard | OrgSphere',
  '/projects': 'Projects | OrgSphere',
  '/employees': 'Employees | OrgSphere',
  '/teams': 'Teams | OrgSphere',
  '/my/dashboard': 'My Dashboard | OrgSphere',
  '/my/tasks': 'My Tasks | OrgSphere',
  '/my/notes': 'My Notes | OrgSphere',
  '/settings': 'Settings | OrgSphere',
  '/login': 'Login | OrgSphere',
}

export function DocumentTitle() {
  const pathname = usePathname()

  useEffect(() => {
    if (titles[pathname]) {
      document.title = titles[pathname]
      return
    }

    if (pathname.startsWith('/projects/')) document.title = 'Project | OrgSphere'
    else if (pathname.startsWith('/employees/')) document.title = 'Employee | OrgSphere'
    else if (pathname.startsWith('/teams/')) document.title = 'Team | OrgSphere'
    else document.title = 'OrgSphere'
  }, [pathname])

  return null
}
