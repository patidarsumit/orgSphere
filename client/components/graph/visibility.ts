import { GraphEdge, GraphModel } from '@/components/graph/types'

function childMapFor(edges: GraphEdge[]) {
  const childMap = new Map<string, string[]>()

  for (const edge of edges) {
    const children = childMap.get(edge.source) ?? []
    children.push(edge.target)
    childMap.set(edge.source, children)
  }

  return childMap
}

function collectHiddenDescendants(
  nodeId: string,
  childMap: Map<string, string[]>,
  hiddenNodeIds: Set<string>
) {
  const children = childMap.get(nodeId) ?? []

  for (const childId of children) {
    if (hiddenNodeIds.has(childId)) continue
    hiddenNodeIds.add(childId)
    collectHiddenDescendants(childId, childMap, hiddenNodeIds)
  }
}

export function getGraphNodeChildCounts(graph: GraphModel) {
  const counts = new Map<string, number>()

  for (const edge of graph.edges) {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1)
  }

  return counts
}

export function getVisibleGraph(graph: GraphModel, collapsedNodeIds: Set<string>): GraphModel {
  if (collapsedNodeIds.size === 0) return graph

  const childMap = childMapFor(graph.edges)
  const hiddenNodeIds = new Set<string>()

  for (const nodeId of collapsedNodeIds) {
    collectHiddenDescendants(nodeId, childMap, hiddenNodeIds)
  }

  return {
    nodes: graph.nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    edges: graph.edges.filter(
      (edge) => !hiddenNodeIds.has(edge.source) && !hiddenNodeIds.has(edge.target)
    ),
  }
}
