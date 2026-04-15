import type { Metadata } from 'next'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Project Detail | OrgSphere',
}

export default function ProjectDetailPage() {
  return (
    <div>
      <PageHeader title="Project Detail" subtitle="Project overview and membership" />
      <EmptyState
        icon={FolderKanban}
        title="Project details coming in Phase 5"
        description="Project timelines, members, and status history will be available when the project module is built."
      />
    </div>
  )
}

