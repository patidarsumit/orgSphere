'use client'

import { Gauge, ListChecks, SignalHigh, UsersRound } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { DonutInsightChart } from '@/components/charts/DonutInsightChart'
import { HorizontalBarInsightChart } from '@/components/charts/HorizontalBarInsightChart'
import { ProgressInsightList } from '@/components/charts/ProgressInsightList'
import { useProjectDetailInsights } from '@/hooks/useInsights'
import { countData } from './InsightMappers'

export function ProjectHealthInsights({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectDetailInsights(projectId)

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ChartCard
        title="Completion"
        subtitle="Done tasks against total tracked tasks"
        icon={Gauge}
        isLoading={isLoading}
      >
        <ProgressInsightList
          data={
            data
              ? [
                  {
                    key: projectId,
                    label: 'Project completion',
                    value: data.completion.percent,
                    detail: `${data.completion.doneTasks}/${data.completion.totalTasks} tasks complete`,
                  },
                ]
              : []
          }
        />
      </ChartCard>
      <ChartCard
        title="Task Status"
        subtitle="Delivery state inside this project"
        icon={ListChecks}
        isLoading={isLoading}
      >
        <DonutInsightChart data={countData(data?.taskStatus ?? [])} />
      </ChartCard>
      <ChartCard
        title="Priority Mix"
        subtitle="Urgency across project tasks"
        icon={SignalHigh}
        isLoading={isLoading}
      >
        <DonutInsightChart data={countData(data?.taskPriority ?? [])} />
      </ChartCard>
      <ChartCard
        title="Assignee Workload"
        subtitle="Open tasks by project member"
        icon={UsersRound}
        isLoading={isLoading}
      >
        <HorizontalBarInsightChart
          data={(data?.assigneeWorkload ?? []).map((item) => ({
            key: item.userId,
            label: item.userName,
            value: item.openTasks,
          }))}
        />
      </ChartCard>
    </section>
  )
}
