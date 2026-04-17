import { ProjectStatus } from '@/types'

export const projectStatusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'planned', label: 'Planned' },
  { value: 'archived', label: 'Archived' },
]

export const commonTech = ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker']

export const statusDotClassName: Record<ProjectStatus, string> = {
  active: 'bg-green-500',
  completed: 'bg-gray-400',
  on_hold: 'bg-amber-500',
  planned: 'bg-blue-500',
  archived: 'bg-gray-500',
}

export const formatProjectDate = (date?: string | null) => {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export const truncateText = (value: string | null | undefined, maxLength: number) => {
  if (!value) {
    return '-'
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
}
