export type GraphNodeKind = 'project' | 'person' | 'team' | 'group' | 'metric' | 'status'

export type GraphNodeTone =
  | 'primary'
  | 'blue'
  | 'green'
  | 'amber'
  | 'purple'
  | 'slate'
  | 'red'

export interface GraphNodeStat {
  label: string
  value: string | number
}

export interface GraphNodeSize {
  width: number
  height: number
}

export const graphNodeDimensions: Record<GraphNodeKind, GraphNodeSize> = {
  project: { width: 300, height: 142 },
  person: { width: 240, height: 126 },
  team: { width: 260, height: 132 },
  group: { width: 240, height: 118 },
  metric: { width: 250, height: 142 },
  status: { width: 220, height: 112 },
}

export interface GraphNode {
  id: string
  kind: GraphNodeKind
  title: string
  subtitle?: string
  details?: string
  eyebrow?: string
  badge?: string
  href?: string
  tone?: GraphNodeTone
  stats?: GraphNodeStat[]
  collapsible?: boolean
  size?: GraphNodeSize
  level: number
  order: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface GraphModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
