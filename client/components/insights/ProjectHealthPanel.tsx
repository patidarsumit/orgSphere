'use client'

import { AlertTriangle, CheckCircle2, CircleAlert, Gauge } from 'lucide-react'
import { useProjectHealth } from '@/hooks/useInsights'
import { ProjectHealthBadge } from './ProjectRiskCard'

export function ProjectHealthPanel({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectHealth(projectId)

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="h-5 w-40 animate-pulse rounded bg-[color:var(--color-surface-low)]" />
        <div className="mt-4 h-28 animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
      </section>
    )
  }

  if (!data) return null

  const Icon =
    data.status === 'healthy' ? CheckCircle2 : data.status === 'attention' ? CircleAlert : AlertTriangle

  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-[color:var(--color-text-primary)]">
            <Gauge size={18} className="text-[color:var(--color-primary)]" />
            Health And Risk Signals
          </h2>
          <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-tertiary)]">
            Explainable signals from ownership, task pressure, overdue work, and recent movement.
          </p>
        </div>
        <ProjectHealthBadge status={data.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-lg bg-[color:var(--color-surface-low)] p-3">
          <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">Score</p>
          <p className="mt-1 text-2xl font-black text-[color:var(--color-text-primary)]">{data.score}</p>
        </div>
        <div className="rounded-lg bg-[color:var(--color-surface-low)] p-3">
          <p className="text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">Complete</p>
          <p className="mt-1 text-2xl font-black text-[color:var(--color-text-primary)]">{data.completionPercent}%</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-[10px] font-black uppercase text-red-500">Overdue</p>
          <p className="mt-1 text-2xl font-black text-red-700">{data.overdueTasks}</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3">
          <p className="text-[10px] font-black uppercase text-rose-500">High Priority</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{data.highPriorityOpenTasks}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-[10px] font-black uppercase text-amber-600">Stale Days</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{data.staleDays ?? 0}</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[color:var(--color-surface-low)] p-4">
        <div className="flex items-center gap-2 text-sm font-black text-[color:var(--color-text-primary)]">
          <Icon size={16} />
          Why this score
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.reasons.map((reason) => (
            <li key={reason} className="text-xs font-semibold text-[color:var(--color-text-secondary)]">
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
