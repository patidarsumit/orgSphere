import { TaskPriority, TaskStatus } from '@/types'

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To-Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const priorityDotClass: Record<TaskPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
}

export const formatTaskDueDate = (value: string | null) => {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export const getDueTone = (value: string | null, status: TaskStatus) => {
  if (!value || status === 'done') return 'text-[color:var(--color-text-tertiary)]'

  const date = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) return 'bg-red-50 text-red-700'
  if (date.getTime() === today.getTime()) return 'bg-amber-50 text-amber-700'
  return 'text-[color:var(--color-text-secondary)]'
}
