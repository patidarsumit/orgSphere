export type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

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
