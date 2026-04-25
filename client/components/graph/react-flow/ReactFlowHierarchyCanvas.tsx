'use client'

import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type NodeMouseHandler,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { layoutLayeredGraph } from '@/components/graph/layout'
import { GraphModel, GraphNode, GraphNodeKind, GraphNodeSize } from '@/components/graph/types'
import {
  HierarchyGraphNode,
  HierarchyGraphNodeActions,
} from '@/components/graph/react-flow/nodes/HierarchyGraphNode'

type HierarchyFlowNode = Node<GraphNode & Record<string, unknown>, 'hierarchy'>
type HierarchyFlowEdge = Edge<{ label?: string }>

const nodeTypes = {
  hierarchy: HierarchyGraphNode,
} satisfies NodeTypes

const LAYOUT_PADDING = 420

const nodeDimensions: Record<GraphNodeKind, GraphNodeSize> = {
  project: { width: 300, height: 142 },
  person: { width: 240, height: 126 },
  team: { width: 260, height: 132 },
  group: { width: 240, height: 118 },
  metric: { width: 250, height: 142 },
  status: { width: 220, height: 112 },
}

function dimensionsFor(node: GraphNode) {
  return node.size ?? nodeDimensions[node.kind]
}

function getTranslateExtent(bounds: ReturnType<typeof layoutLayeredGraph>['bounds']) {
  return [
    [bounds.minX - LAYOUT_PADDING, bounds.minY - LAYOUT_PADDING],
    [bounds.maxX + LAYOUT_PADDING, bounds.maxY + LAYOUT_PADDING],
  ] satisfies [[number, number], [number, number]]
}

function toFlowNodes(
  layout: ReturnType<typeof layoutLayeredGraph>,
  actions?: HierarchyGraphNodeActions
): HierarchyFlowNode[] {
  return layout.nodes.map(({ node, position, size }) => {
    return {
      id: node.id,
      type: 'hierarchy' as const,
      data: { ...node, actions } as GraphNode & Record<string, unknown>,
      position,
      initialWidth: size.width,
      initialHeight: size.height,
      draggable: false,
      connectable: false,
      selectable: false,
    }
  })
}

function toFlowEdges(graph: GraphModel): HierarchyFlowEdge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: { label: edge.label },
    type: 'smoothstep',
    selectable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: '#94a3b8',
    },
    style: {
      stroke: '#94a3b8',
      strokeWidth: 1.5,
    },
  }))
}

export function ReactFlowHierarchyCanvas({
  graph,
  actions,
}: {
  graph: GraphModel
  actions?: HierarchyGraphNodeActions
}) {
  const layout = useMemo(
    () =>
      layoutLayeredGraph(graph, {
        getNodeSize: dimensionsFor,
        horizontalGap: 78,
        verticalGap: 104,
      }),
    [graph]
  )
  const nodes = useMemo(() => toFlowNodes(layout, actions), [layout, actions])
  const edges = useMemo(() => toFlowEdges(graph), [graph])
  const translateExtent = useMemo(() => getTranslateExtent(layout.bounds), [layout.bounds])
  const onNodeClick: NodeMouseHandler<HierarchyFlowNode> = (_, node) => {
    if (node.data.collapsible) {
      actions?.onToggleCollapse(node.id)
    }
  }

  return (
    <div className="h-[680px] w-full overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: false }}
        minZoom={0.08}
        maxZoom={1.35}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={onNodeClick}
        translateExtent={translateExtent}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#dbe3ef" gap={20} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
