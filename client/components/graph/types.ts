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
