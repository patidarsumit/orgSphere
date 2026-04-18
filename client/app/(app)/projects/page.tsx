import type { Metadata } from 'next'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Projects | OrgSphere',
}

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader title="Projects" subtitle="All company projects" />
      <EmptyState
        icon={FolderKanban}
        title="Projects coming in Phase 5"
        description="The projects module will be built after employees and teams are set up."
      />
    </div>
  )
}
