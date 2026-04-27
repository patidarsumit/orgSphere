'use client'

import Link from 'next/link'
import { ArrowLeft, CalendarDays, FolderKanban, ListChecks, SignalHigh } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { DonutInsightChart } from '@/components/charts/DonutInsightChart'
import { HorizontalBarInsightChart } from '@/components/charts/HorizontalBarInsightChart'
import { LineInsightChart } from '@/components/charts/LineInsightChart'
import { countData } from '@/components/insights/InsightMappers'
import { useMyTaskInsights } from '@/hooks/useInsights'

export default function MyTaskInsightsPage() {
  const { data, isLoading } = useMyTaskInsights()

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <section className="w-full space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/my/tasks"
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-primary)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to tasks
            </Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--color-text-primary)]">
              My Task Insights
            </h1>
            <p className="mt-2 max-w-2xl font-medium text-[color:var(--color-text-tertiary)]">
              Personal workload, priority mix, due dates, and project load for your assigned work.
            </p>
          </div>
          <Link
            href="/my/tasks"
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-white px-5 py-3 text-sm font-bold text-[color:var(--color-text-primary)] shadow-sm hover:text-[color:var(--color-primary)]"
          >
            Manage Tasks
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title="Task Status"
            subtitle="Where your assigned tasks currently stand"
            icon={ListChecks}
            isLoading={isLoading}
          >
            <DonutInsightChart data={countData(data?.taskStatus ?? [])} />
          </ChartCard>
          <ChartCard
            title="Priority Mix"
            subtitle="Urgency across your assigned tasks"
            icon={SignalHigh}
            isLoading={isLoading}
          >
            <DonutInsightChart data={countData(data?.taskPriority ?? [])} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title="Due Soon"
            subtitle="Open tasks due over the next 14 days"
            icon={CalendarDays}
            isLoading={isLoading}
          >
            <LineInsightChart data={data?.dueSoon ?? []} />
          </ChartCard>
          <ChartCard
            title="Project Load"
            subtitle="Open tasks grouped by project"
            icon={FolderKanban}
            isLoading={isLoading}
          >
            <HorizontalBarInsightChart
              data={(data?.projectLoad ?? []).map((item) => ({
                key: item.projectId,
                label: item.projectName,
                value: item.openTasks,
              }))}
            />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
