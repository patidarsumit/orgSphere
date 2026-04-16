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
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planned' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

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
