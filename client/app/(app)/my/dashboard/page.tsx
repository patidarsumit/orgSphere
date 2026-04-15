import type { Metadata } from 'next'
import { House } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'My Dashboard | OrgSphere',
}

export default function MyDashboardPage() {
  return (
    <div>
      <PageHeader title="My Dashboard" subtitle="Your personal workspace overview" />
      <EmptyState
        icon={House}
        title="My Dashboard coming in Phase 6"
        description="Personal assignments, notes, and project shortcuts will be connected in the workspace phase."
      />
    </div>
  )
}
