'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react'
import { ProjectHealthSignal, ProjectHealthStatus } from '@/types/insights'

const healthStyles: Record<
  ProjectHealthStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-green-50 text-green-700',
    icon: CheckCircle2,
  },
  attention: {
    label: 'Attention',
    className: 'bg-amber-50 text-amber-700',
    icon: CircleAlert,
  },
  at_risk: {
    label: 'At Risk',
    className: 'bg-red-50 text-red-700',
    icon: AlertTriangle,
  },
}

export function ProjectHealthBadge({ status }: { status: ProjectHealthStatus }) {
  const style = healthStyles[status]
  const Icon = style.icon

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${style.className}`}>
      <Icon size={13} />
      {style.label}
    </span>
  )
}

export function ProjectRiskCard({ signal }: { signal: ProjectHealthSignal }) {
  return (
    <Link
      href={`/projects/${signal.projectId}`}
      className="block rounded-xl border border-[color:var(--color-border)] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[color:var(--color-text-primary)]">
            {signal.projectName}
          </h3>
          <p className="mt-1 text-xs font-semibold text-[color:var(--color-text-tertiary)]">
            Score {signal.score}/100
          </p>
        </div>
        <ProjectHealthBadge status={signal.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-[color:var(--color-surface-low)] p-2">
          <p className="text-lg font-black text-[color:var(--color-text-primary)]">{signal.openTasks}</p>
          <p className="text-[10px] font-bold uppercase text-[color:var(--color-text-tertiary)]">Open</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2">
          <p className="text-lg font-black text-red-700">{signal.overdueTasks}</p>
          <p className="text-[10px] font-bold uppercase text-red-500">Overdue</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-2">
          <p className="text-lg font-black text-rose-700">{signal.highPriorityOpenTasks}</p>
          <p className="text-[10px] font-bold uppercase text-rose-500">High</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1">
        {signal.reasons.slice(0, 2).map((reason) => (
          <li key={reason} className="truncate text-xs font-semibold text-[color:var(--color-text-secondary)]">
            {reason}
          </li>
        ))}
      </ul>
    </Link>
  )
}
