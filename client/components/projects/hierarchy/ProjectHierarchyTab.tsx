'use client'

import { useCallback, useMemo, useState } from 'react'
import { GitBranch, Loader2 } from 'lucide-react'
import { getGraphNodeChildCounts, getVisibleGraph } from '@/components/graph/visibility'
import { ReactFlowHierarchyCanvas } from '@/components/graph/react-flow/ReactFlowHierarchyCanvas'
import { useProjectTasks } from '@/hooks/useTasks'
import { Project } from '@/types'
import { buildProjectHierarchyGraph } from './buildProjectHierarchyGraph'

export function ProjectHierarchyTab({ project }: { project: Project }) {
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set())
  const { data, isLoading } = useProjectTasks(project.id, { limit: 100 })
  const tasks = useMemo(() => data?.data ?? [], [data?.data])
  const graph = useMemo(
    () => buildProjectHierarchyGraph(project, tasks, { taskTotal: data?.total }),
    [data?.total, project, tasks]
  )
  const visibleGraph = useMemo(() => getVisibleGraph(graph, collapsedNodeIds), [graph, collapsedNodeIds])
  const childCounts = useMemo(() => getGraphNodeChildCounts(graph), [graph])
  const actions = useMemo(
    () => ({
      collapsedNodeIds,
      childCounts,
      onToggleCollapse: (nodeId: string) => {
        setCollapsedNodeIds((current) => {
          const next = new Set(current)
          if (next.has(nodeId)) {
            next.delete(nodeId)
          } else {
            next.add(nodeId)
          }
          return next
        })
      },
    }),
    [childCounts, collapsedNodeIds]
  )

  const expandAll = useCallback(() => {
    setCollapsedNodeIds(new Set())
  }, [])

  return (
    <section className="space-y-5 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-[color:var(--color-text-primary)]">
            <GitBranch size={24} className="text-[color:var(--color-primary)]" />
            Project Hierarchy
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
            Ownership, team structure, and delivery state for this project.
          </p>
        </div>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-low)] px-3 py-1.5 text-xs font-bold text-[color:var(--color-text-tertiary)]">
            <Loader2 size={14} className="animate-spin" />
            Loading tasks
          </span>
        ) : (
          <div className="flex items-center gap-2">
            {collapsedNodeIds.size > 0 ? (
              <button
                type="button"
                onClick={expandAll}
                className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1.5 text-xs font-bold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)] hover:text-white"
              >
                Expand All
              </button>
            ) : null}
            <span className="rounded-full bg-[color:var(--color-surface-low)] px-3 py-1.5 text-xs font-bold text-[color:var(--color-text-secondary)]">
              {visibleGraph.nodes.length}/{graph.nodes.length} nodes
            </span>
          </div>
        )}
      </div>

      <ReactFlowHierarchyCanvas graph={visibleGraph} actions={actions} />
    </section>
  )
}
