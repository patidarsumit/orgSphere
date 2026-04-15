import type { Metadata } from 'next'
import { CheckSquare } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'My Tasks | OrgSphere',
}

export default function MyTasksPage() {
  return (
    <div>
      <PageHeader title="My Tasks" subtitle="Track your assigned work" />
      <EmptyState
        icon={CheckSquare}
        title="Tasks coming in Phase 6"
        description="Task lists, status updates, and personal filters will be built with the workspace module."
      />
    </div>
  )
}
