import type { Metadata } from 'next'
import { Settings } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Settings | OrgSphere',
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Admin workspace configuration" />
      <EmptyState
        icon={Settings}
        title="Settings coming in Phase 8"
        description="Organization-wide settings and search configuration will be completed after the core modules."
      />
    </div>
  )
}
