'use client'

import Link from 'next/link'
import { ArrowLeft, FolderKanban, Layers3, ListChecks, ServerCog, UsersRound } from 'lucide-react'
import { ChartCard } from '@/components/charts/ChartCard'
import { DonutInsightChart } from '@/components/charts/DonutInsightChart'
import { HorizontalBarInsightChart } from '@/components/charts/HorizontalBarInsightChart'
import { ProgressInsightList } from '@/components/charts/ProgressInsightList'
import { useProjectsInsights } from '@/hooks/useInsights'
import { countData } from '@/components/insights/InsightMappers'

export default function ProjectsInsightsPage() {
  const { data, isLoading } = useProjectsInsights()

  return (
    <div className="-m-8 min-h-full bg-[color:var(--color-surface-low)] p-5 sm:p-8">
      <section className="w-full space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--color-primary)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to projects
            </Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--color-text-primary)]">
              Project Insights
            </h1>
            <p className="mt-2 max-w-2xl font-medium text-[color:var(--color-text-tertiary)]">
              Portfolio health, ownership distribution, workload, and technology usage across OrgSphere projects.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-white px-5 py-3 text-sm font-bold text-[color:var(--color-text-primary)] shadow-sm hover:text-[color:var(--color-primary)]"
          >
            Manage Projects
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            title="Project Status"
            subtitle="Current project lifecycle breakdown"
            icon={FolderKanban}
            isLoading={isLoading}
          >
            <DonutInsightChart data={countData(data?.projectStatus ?? [])} />
          </ChartCard>
          <ChartCard
            title="Projects By Team"
            subtitle="Where project ownership is concentrated"
            icon={UsersRound}
            isLoading={isLoading}
          >
            <HorizontalBarInsightChart
              data={(data?.projectsByTeam ?? []).map((item) => ({
                key: item.teamId,
                label: item.teamName,
                value: item.projectCount,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Tech Stack Usage"
            subtitle="Most common technologies across projects"
            icon={ServerCog}
            isLoading={isLoading}
          >
            <HorizontalBarInsightChart
              data={(data?.techStackUsage ?? []).map((item) => ({
                key: item.tech,
                label: item.tech,
                value: item.count,
              }))}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ChartCard
            title="Open Work By Project"
            subtitle="Projects carrying the most unfinished tasks"
            icon={ListChecks}
            isLoading={isLoading}
          >
            <HorizontalBarInsightChart
              data={(data?.topProjectsByOpenTasks ?? []).map((item) => ({
                key: item.projectId,
                label: item.projectName,
                value: item.openTasks,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Project Completion"
            subtitle="Completion percentage for projects with tracked tasks"
            icon={Layers3}
            isLoading={isLoading}
          >
            <ProgressInsightList
              data={(data?.projectCompletion ?? []).map((item) => ({
                key: item.projectId,
                label: item.projectName,
                value: item.completion,
                detail: `${item.doneTasks}/${item.totalTasks} tasks complete`,
              }))}
            />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
