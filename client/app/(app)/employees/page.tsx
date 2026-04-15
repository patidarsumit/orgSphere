import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Employees | OrgSphere',
}

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader title="Employees" subtitle="Browse the company directory" />
      <EmptyState
        icon={Users}
        title="Employees coming in Phase 3"
        description="The employee directory and profile views will be built in the next feature phase."
      />
    </div>
  )
}
