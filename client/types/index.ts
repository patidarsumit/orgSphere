export type UserRole = 'admin' | 'hr' | 'manager' | 'tech_lead' | 'employee' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  skills: string[]
  avatar_path: string | null
  manager_id: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Employee extends User {
  manager?: User | null
  direct_reports?: User[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_path: string | null
  department: string | null
}

export interface Team {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  members: TeamMember[]
  creator?: User | null
  projects_count?: number
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planned' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  user: User
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  tech_stack: string[]
  start_date: string | null
  manager_id: string | null
  tech_lead_id: string | null
  team_id: string | null
  manager: User | null
  tech_lead: User | null
  team: { id: string; name: string; description?: string | null } | null
  project_members: ProjectMember[]
  created_at: string
  updated_at: string
}

export interface UserProject {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  project: {
    id: string
    name: string
    status: ProjectStatus
    tech_stack: string[]
    description: string | null
    start_date?: string | null
    team: { id: string; name: string } | null
  }
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  assigned_to: string
  assignee?: User
  project_id: string | null
  project: { id: string; name: string } | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: Record<string, unknown>
  tags: string[]
  user_id: string
  project_id: string | null
  project: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export type ActivityColor = 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal'

export interface ActivityItem {
  id: string
  actor_name: string
  actor_avatar: string | null
  actor_id: string | null
  message: string
  entity_type: string
  entity_id: string
  entity_name: string | null
  action: string
  color: ActivityColor
  created_at: string
  time_ago: string
}

export interface ActivityFeed {
  data: ActivityItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SearchResult {
  id: string
  name: string
  type: 'project' | 'employee' | 'team'
  status?: ProjectStatus
  tech_stack?: string[]
  manager_name?: string | null
  email?: string
  role?: UserRole
  avatar_path?: string | null
  department?: string | null
  description?: string | null
  member_count?: number
}

export interface SearchResponse {
  query: string
  projects: SearchResult[]
  employees: SearchResult[]
  teams: SearchResult[]
  total: number
}

export interface SettingsOverview {
  totalUsers: number
  totalProjects: number
  totalTeams: number
}
