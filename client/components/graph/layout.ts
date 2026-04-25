import { GraphModel, GraphNode, GraphNodeSize } from '@/components/graph/types'

export interface LayoutedGraphNode {
  node: GraphNode
  position: {
    x: number
    y: number
  }
  size: GraphNodeSize
}

export interface GraphLayoutBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface LayeredGraphLayout {
  nodes: LayoutedGraphNode[]
  bounds: GraphLayoutBounds
}

export interface LayeredGraphLayoutOptions {
  getNodeSize: (node: GraphNode) => GraphNodeSize
  horizontalGap?: number
  verticalGap?: number
}

const emptyBounds: GraphLayoutBounds = {
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  width: 0,
  height: 0,
}

function boundsFor(nodes: LayoutedGraphNode[]): GraphLayoutBounds {
  if (nodes.length === 0) return emptyBounds

  const minX = Math.min(...nodes.map((item) => item.position.x))
  const minY = Math.min(...nodes.map((item) => item.position.y))
  const maxX = Math.max(...nodes.map((item) => item.position.x + item.size.width))
  const maxY = Math.max(...nodes.map((item) => item.position.y + item.size.height))

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function layoutLayeredGraph(
  graph: GraphModel,
  options: LayeredGraphLayoutOptions
): LayeredGraphLayout {
  const horizontalGap = options.horizontalGap ?? 72
  const verticalGap = options.verticalGap ?? 96
  const levels = new Map<number, GraphNode[]>()

  for (const node of graph.nodes) {
    const levelNodes = levels.get(node.level) ?? []
    levelNodes.push(node)
    levels.set(node.level, levelNodes)
  }

  const nodesByLevel = Array.from(levels.entries())
    .toSorted(([firstLevel], [secondLevel]) => firstLevel - secondLevel)
    .map(([level, nodes]) => [
      level,
      nodes.toSorted((first, second) => first.order - second.order || first.title.localeCompare(second.title)),
    ] as const)

  const levelY = new Map<number, number>()
  let currentY = 0

  for (const [level, nodes] of nodesByLevel) {
    levelY.set(level, currentY)
    const rowHeight = Math.max(...nodes.map((node) => options.getNodeSize(node).height))
    currentY += rowHeight + verticalGap
  }

  const layoutedNodes = nodesByLevel.flatMap(([level, nodes]) => {
    const rowWidth =
      nodes.reduce((width, node) => width + options.getNodeSize(node).width, 0) +
      Math.max(nodes.length - 1, 0) * horizontalGap
    const rowHeight = Math.max(...nodes.map((node) => options.getNodeSize(node).height))
    let cursorX = -rowWidth / 2

    return nodes.map((node) => {
      const size = options.getNodeSize(node)
      const item: LayoutedGraphNode = {
        node,
        size,
        position: {
          x: cursorX,
          y: (levelY.get(level) ?? 0) + (rowHeight - size.height) / 2,
        },
      }
      cursorX += size.width + horizontalGap
      return item
    })
  })

  return {
    nodes: layoutedNodes,
    bounds: boundsFor(layoutedNodes),
  }
}
