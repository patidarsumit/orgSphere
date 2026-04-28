import { ActivityLog } from '../entities/ActivityLog'
import { AppDataSource } from '../data-source'

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
  href: string | null
  is_navigable: boolean
  created_at: string
  time_ago: string
}

export interface ActivityViewer {
  id: string
  role: string
}

type NavigationContext = {
  taskTargets: Map<string, { assignedTo: string; projectId: string | null }>
  noteOwners: Map<string, string>
  postTargets: Map<string, { slug: string; status: string }>
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
  post: 'post',
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

const emptyNavigationContext: NavigationContext = {
  taskTargets: new Map(),
  noteOwners: new Map(),
  postTargets: new Map(),
}

const getActivityHref = (
  log: ActivityLog,
  viewer?: ActivityViewer,
  navigationContext: NavigationContext = emptyNavigationContext
) => {
  if (log.action === 'deleted') return null

  if (log.entity_type === 'project' || log.entity_type === 'project_member') {
    return `/projects/${log.entity_id}`
  }

  if (log.entity_type === 'employee') return `/employees/${log.entity_id}`

  if (log.entity_type === 'team' || log.entity_type === 'team_member') {
    return `/teams/${log.entity_id}`
  }

  if (log.entity_type === 'task') {
    const taskTarget = navigationContext.taskTargets.get(log.entity_id)
    if (!taskTarget || !viewer) return null
    if (taskTarget.assignedTo === viewer.id) {
      return `/my/tasks?task=${log.entity_id}`
    }
    return taskTarget.projectId ? `/projects/${taskTarget.projectId}` : null
  }

  if (log.entity_type === 'note') {
    const ownerId = navigationContext.noteOwners.get(log.entity_id)
    if (!ownerId || !viewer || ownerId !== viewer.id) return null
    return `/my/notes?note=${log.entity_id}`
  }

  if (log.entity_type === 'post') {
    const postTarget = navigationContext.postTargets.get(log.entity_id)
    if (!postTarget) return '/content/blog'
    return postTarget.status === 'published' ? `/blog/${postTarget.slug}` : '/content/blog'
  }

  return null
}

export const format = (
  log: ActivityLog,
  viewer?: ActivityViewer,
  navigationContext: NavigationContext = emptyNavigationContext
): FormattedActivity => {
  const entityLabel = entityLabels[log.entity_type] ?? log.entity_type
  const entityName = log.entity_name ? `${entityLabel} "${log.entity_name}"` : entityLabel
  const messageFn = actionMessages[log.action]
  const href = getActivityHref(log, viewer, navigationContext)

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
    href,
    is_navigable: Boolean(href),
    created_at: log.created_at.toISOString(),
    time_ago: timeAgo(new Date(log.created_at)),
  }
}

const buildNavigationContext = async (logs: ActivityLog[]): Promise<NavigationContext> => {
  const taskIds = logs.filter((log) => log.entity_type === 'task').map((log) => log.entity_id)
  const noteIds = logs.filter((log) => log.entity_type === 'note').map((log) => log.entity_id)
  const postIds = logs.filter((log) => log.entity_type === 'post').map((log) => log.entity_id)

  const [tasks, notes, posts] = await Promise.all([
    taskIds.length > 0
      ? AppDataSource.manager.query(
          'SELECT id, assigned_to AS "assignedTo", project_id AS "projectId" FROM tasks WHERE id = ANY($1::uuid[])',
          [taskIds]
        )
      : [],
    noteIds.length > 0
      ? AppDataSource.manager.query(
          'SELECT id, user_id AS "ownerId" FROM notes WHERE id = ANY($1::uuid[])',
          [noteIds]
        )
      : [],
    postIds.length > 0
      ? AppDataSource.manager.query(
          'SELECT id, slug, status FROM posts WHERE id = ANY($1::uuid[])',
          [postIds]
        )
      : [],
  ])

  return {
    taskTargets: new Map(
      tasks.map((task: { id: string; assignedTo: string; projectId: string | null }) => [
        task.id,
        { assignedTo: task.assignedTo, projectId: task.projectId },
      ])
    ),
    noteOwners: new Map(
      notes.map((note: { id: string; ownerId: string }) => [note.id, note.ownerId])
    ),
    postTargets: new Map(
      posts.map((post: { id: string; slug: string; status: string }) => [
        post.id,
        { slug: post.slug, status: post.status },
      ])
    ),
  }
}

export const formatMany = async (
  logs: ActivityLog[],
  viewer?: ActivityViewer
): Promise<FormattedActivity[]> => {
  const navigationContext = await buildNavigationContext(logs)
  return logs.map((log) => format(log, viewer, navigationContext))
}
