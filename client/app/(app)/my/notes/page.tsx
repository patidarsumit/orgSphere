import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'My Notes | OrgSphere',
}

export default function MyNotesPage() {
  return (
    <div>
      <PageHeader title="My Notes" subtitle="Capture project and personal context" />
      <EmptyState
        icon={FileText}
        title="Notes coming in Phase 6"
        description="Rich-text notes with project links and tags will arrive in the workspace phase."
      />
    </div>
  )
}
