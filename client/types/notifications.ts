export type NotificationType =
  | 'task_assigned'
  | 'project_member_added'
  | 'project_member_removed'
  | 'project_owner_changed'

export interface AppNotification {
  id: string
  recipient_id: string
  activity_log_id: string | null
  type: NotificationType
  title: string
  message: string
  target_url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface NotificationFeed {
  data: AppNotification[]
  total: number
  page: number
  limit: number
  totalPages: number
}
