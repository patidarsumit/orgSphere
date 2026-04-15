import type { Metadata } from 'next'
import { UsersRound } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Team Detail | OrgSphere',
}

export default function TeamDetailPage() {
  return (
    <div>
      <PageHeader title="Team Detail" subtitle="Team membership and ownership" />
      <EmptyState
        icon={UsersRound}
        title="Team details coming in Phase 4"
        description="Team membership, linked projects, and ownership history will arrive in the teams phase."
      />
    </div>
  )
}

