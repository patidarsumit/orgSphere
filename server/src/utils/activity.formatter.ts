import { ActivityLog } from '../entities/ActivityLog'

export interface FormattedActivity {
  id: string
  actor_name: string
  actor_avatar: string | null
  actor_id: string | null
  message: string
  entity_type: string
  entity_id: string
  entity_name: string | null
  action: string
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'teal'
  created_at: string
  time_ago: string
}

const actionColors: Record<string, FormattedActivity['color']> = {
  created: 'green',
  updated: 'blue',
  deleted: 'red',
  member_added: 'teal',
  member_removed: 'amber',
  status_changed: 'purple',
  assigned: 'blue',
  completed: 'green',
  uploaded: 'teal',
  commented: 'blue',
}

const entityLabels: Record<string, string> = {
  project: 'project',
  employee: 'employee',
  team: 'team',
  task: 'task',
  note: 'note',
  project_member: 'project',
  team_member: 'team',
}

const actionMessages: Record<
  string,
  (entityName: string, metadata: Record<string, unknown>) => string
> = {
  created: (name) => `created ${name}`,
  updated: (name) => `updated ${name}`,
  deleted: (name) => `deleted ${name}`,
  member_added: (name, meta) => `added ${String(meta.member_name ?? 'a member')} to ${name}`,
  member_removed: (name, meta) =>
    `removed ${String(meta.member_name ?? 'a member')} from ${name}`,
  status_changed: (name, meta) =>
    `changed status of ${name} to ${String(meta.new_status ?? 'unknown')}`,
  assigned: (name, meta) => `assigned ${name} to ${String(meta.assignee_name ?? 'someone')}`,
  completed: (name) => `completed ${name}`,
  uploaded: (name) => `uploaded a file to ${name}`,
  commented: (name) => `commented on ${name}`,
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

export const format = (log: ActivityLog): FormattedActivity => {
  const entityLabel = entityLabels[log.entity_type] ?? log.entity_type
  const entityName = log.entity_name ? `${entityLabel} "${log.entity_name}"` : entityLabel
  const messageFn = actionMessages[log.action]

  return {
    id: log.id,
    actor_name: log.actor?.name ?? 'System',
    actor_avatar: log.actor?.avatar_path ?? null,
    actor_id: log.actor_id,
    message: messageFn ? messageFn(entityName, log.metadata) : `${log.action} ${entityName}`,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    entity_name: log.entity_name,
    action: log.action,
    color: actionColors[log.action] ?? 'blue',
    created_at: log.created_at.toISOString(),
    time_ago: timeAgo(new Date(log.created_at)),
  }
}

export const formatMany = (logs: ActivityLog[]): FormattedActivity[] => logs.map(format)
