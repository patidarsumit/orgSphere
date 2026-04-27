'use client'

import { useMemo } from 'react'
import { Activity, CheckCircle2, FolderKanban, ListChecks, UsersRound } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { DonutInsightChart } from '@/components/charts/DonutInsightChart'
import { HorizontalBarInsightChart } from '@/components/charts/HorizontalBarInsightChart'
import { LineInsightChart } from '@/components/charts/LineInsightChart'
import { useDashboardInsights } from '@/hooks/useInsights'
import { countData } from './InsightMappers'

export function DashboardInsightsSection() {
  const { data, isLoading } = useDashboardInsights()
  const projectStatus = useMemo(() => countData(data?.projectStatus ?? []), [data?.projectStatus])
  const taskStatus = useMemo(() => countData(data?.taskStatus ?? []), [data?.taskStatus])
  const taskPriority = useMemo(() => countData(data?.taskPriority ?? []), [data?.taskPriority])
  const teamWorkload = useMemo(
    () =>
      (data?.teamWorkload ?? []).map((item) => ({
        key: item.teamId,
        label: item.teamName,
        value: item.openTasks,
      })),
    [data?.teamWorkload]
  )

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <ChartCard
        title="Project Status"
        subtitle="Portfolio shape across all tracked projects"
        icon={FolderKanban}
        isLoading={isLoading}
      >
        <DonutInsightChart data={projectStatus} />
      </ChartCard>
      <ChartCard
        title="Task Status"
        subtitle="Execution state across open work"
        icon={ListChecks}
        isLoading={isLoading}
      >
        <DonutInsightChart data={taskStatus} />
      </ChartCard>
      <ChartCard
        title="Team Workload"
        subtitle="Open tasks grouped by owning team"
        icon={UsersRound}
        isLoading={isLoading}
      >
        <HorizontalBarInsightChart data={teamWorkload} />
      </ChartCard>
      <ChartCard
        title="Activity Trend"
        subtitle="Workspace activity over the last 14 days"
        icon={Activity}
        isLoading={isLoading}
      >
        <LineInsightChart data={data?.activityTrend ?? []} />
      </ChartCard>
      <ChartCard
        title="Priority Mix"
        subtitle="Task urgency across the workspace"
        icon={CheckCircle2}
        isLoading={isLoading}
      >
        <DonutInsightChart data={taskPriority} />
      </ChartCard>
    </section>
  )
}
