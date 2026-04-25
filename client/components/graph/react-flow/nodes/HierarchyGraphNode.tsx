'use client'

import Link from 'next/link'
import { memo, type MouseEvent } from 'react'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FolderKanban,
  Gauge,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { GraphNode, GraphNodeKind, GraphNodeTone } from '@/components/graph/types'

type HierarchyReactFlowNode = Node<GraphNode & Record<string, unknown>, 'hierarchy'>

export interface HierarchyGraphNodeActions {
  collapsedNodeIds: Set<string>
  childCounts: Map<string, number>
  onToggleCollapse: (nodeId: string) => void
}

const nodeSizeClassName: Record<GraphNodeKind, string> = {
  project: 'h-[142px] w-[300px]',
  person: 'h-[126px] w-[240px]',
  team: 'h-[132px] w-[260px]',
  group: 'h-[118px] w-[240px]',
  metric: 'h-[142px] w-[250px]',
  status: 'h-[112px] w-[220px]',
}

const toneClassName: Record<GraphNodeTone, string> = {
  primary: 'border-[color:var(--color-primary)]/25 bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]',
  blue: 'border-blue-100 bg-blue-50 text-blue-700',
  green: 'border-green-100 bg-green-50 text-green-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-700',
  purple: 'border-purple-100 bg-purple-50 text-purple-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  red: 'border-red-100 bg-red-50 text-red-700',
}

const iconByKind: Record<GraphNodeKind, typeof FolderKanban> = {
  project: FolderKanban,
  person: UserRound,
  team: UsersRound,
  group: BriefcaseBusiness,
  metric: Gauge,
  status: CircleDot,
}

function GraphNodeContent({
  data,
  actions,
}: {
  data: GraphNode
  actions?: HierarchyGraphNodeActions
}) {
  const Icon = iconByKind[data.kind]
  const tone = data.tone ?? 'slate'
  const childCount = actions?.childCounts.get(data.id) ?? 0
  const canCollapse = Boolean(data.collapsible && childCount > 0 && actions)
  const isCollapsed = actions?.collapsedNodeIds.has(data.id) ?? false
  const tooltip = [data.eyebrow, data.title, data.subtitle, data.details]
    .filter(Boolean)
    .join('\n')
  const toggleCollapse = () => {
    actions?.onToggleCollapse(data.id)
  }

  return (
    <div
      title={tooltip || data.title}
      className={`${nodeSizeClassName[data.kind]} relative overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.85)] transition-shadow hover:shadow-[0_22px_48px_-34px_rgba(15,23,42,0.95)] ${
        canCollapse ? 'cursor-pointer' : ''
      }`}
      onClick={(event) => {
        if (!canCollapse) return
        event.preventDefault()
        event.stopPropagation()
        toggleCollapse()
      }}
    >
      {canCollapse ? (
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onMouseDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggleCollapse()
          }}
          className="nodrag nopan absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--color-border)] bg-white text-[color:var(--color-text-tertiary)] shadow-sm transition-colors hover:border-[color:var(--color-primary)]/30 hover:bg-[color:var(--color-primary-light)] hover:text-[color:var(--color-primary)]"
          aria-label={isCollapsed ? `Expand ${data.title}` : `Collapse ${data.title}`}
          title={isCollapsed ? `Expand ${childCount} child nodes` : `Collapse ${childCount} child nodes`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : null}

      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneClassName[tone]}`}
        >
          <Icon size={18} />
        </span>
        <span className={`min-w-0 flex-1 ${canCollapse ? 'pr-8' : ''}`}>
          {data.eyebrow ? (
            <span className="block truncate text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
              {data.eyebrow}
            </span>
          ) : null}
          {data.href ? (
            <Link
              href={data.href}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                event.stopPropagation()
              }}
              className="nodrag nopan mt-0.5 block truncate text-sm font-black text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
            >
              {data.title}
            </Link>
          ) : (
            <span className="mt-0.5 block truncate text-sm font-black text-[color:var(--color-text-primary)]">
              {data.title}
            </span>
          )}
          {data.subtitle ? (
            <span className="mt-1 block truncate text-xs leading-5 text-[color:var(--color-text-tertiary)]">
              {data.subtitle}
            </span>
          ) : null}
        </span>
      </div>

      {data.badge ? (
        <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-[color:var(--color-surface-low)] px-3 py-1 text-[11px] font-bold text-[color:var(--color-text-secondary)]">
          <ShieldCheck size={12} className="text-[color:var(--color-primary)]" />
          <span className="truncate">{data.badge}</span>
        </div>
      ) : null}

      {data.stats && data.stats.length > 0 ? (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-hidden">
          {data.stats.slice(0, canCollapse ? 2 : 3).map((stat) => (
            <span
              key={stat.label}
              className="min-w-0 rounded-full bg-[color:var(--color-surface-low)] px-2 py-1 text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]"
              title={`${stat.label}: ${stat.value}`}
            >
              <span className="truncate">
                {stat.label} {stat.value}
              </span>
            </span>
          ))}
          {canCollapse ? (
            <span
              className="ml-auto shrink-0 rounded-full bg-[color:var(--color-surface-low)] px-2 py-1 text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]"
              title={`${childCount} linked nodes`}
            >
              {childCount} linked
            </span>
          ) : null}
        </div>
      ) : canCollapse ? (
        <div className="absolute bottom-3 right-3 rounded-full bg-[color:var(--color-surface-low)] px-2 py-1 text-[10px] font-black uppercase text-[color:var(--color-text-tertiary)]">
          {childCount} linked
        </div>
      ) : null}
    </div>
  )
}

export const HierarchyGraphNode = memo(function HierarchyGraphNode({
  data,
  isConnectable,
}: NodeProps<HierarchyReactFlowNode>) {
  const actions = data.actions as HierarchyGraphNodeActions | undefined

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="opacity-0"
        style={{ pointerEvents: 'none' }}
      />
      <GraphNodeContent data={data} actions={actions} />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="opacity-0"
        style={{ pointerEvents: 'none' }}
      />
    </>
  )
})
