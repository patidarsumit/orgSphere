import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = {
  title: 'Employee Profile | OrgSphere',
}

export default function EmployeeDetailPage() {
  return (
    <div>
      <PageHeader title="Employee Profile" subtitle="Directory profile and reporting context" />
      <EmptyState
        icon={Users}
        title="Employee profiles coming in Phase 3"
        description="Skills, reporting lines, and project assignments will be connected in the employee module."
      />
    </div>
  )
}

