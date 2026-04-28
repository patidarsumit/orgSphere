'use client'

import Link from 'next/link'
import { ActivitySquare } from 'lucide-react'
import { useProjectsHealth } from '@/hooks/useInsights'
import { ProjectRiskCard } from './ProjectRiskCard'

export function ProjectHealthDashboardCard() {
  const { data, isLoading } = useProjectsHealth()
  const riskyProjects = (data?.projects ?? [])
    .filter((project) => project.status !== 'healthy')
    .slice(0, 3)

  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-[color:var(--color-text-primary)]">
            <ActivitySquare size={18} className="text-[color:var(--color-primary)]" />
            Project Health
          </h2>
          <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-tertiary)]">
            Projects needing attention from current delivery signals.
          </p>
        </div>
        <Link href="/projects/insights" className="text-xs font-black text-[color:var(--color-primary)] hover:underline">
          View insights
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-[color:var(--color-surface-low)]" />
          ))}
        </div>
      ) : riskyProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {riskyProjects.map((project) => (
            <ProjectRiskCard key={project.projectId} signal={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 p-4 text-sm font-bold text-green-700">
          No active project risk signals right now.
        </div>
      )}
    </section>
  )
}
