import { AppDataSource } from '../data-source'
import { Notification, NotificationType } from '../entities/Notification'

export interface CreateNotificationInput {
  recipient_id: string
  type: NotificationType
  title: string
  message: string
  target_url?: string | null
  activity_log_id?: string | null
  metadata?: Record<string, unknown>
}

const repo = () => AppDataSource.getRepository(Notification)

const isMissingNotificationTableError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === '42P01'

const logNotificationError = (error: unknown) => {
  if (isMissingNotificationTableError(error)) {
    console.warn('Notification skipped: notifications table is missing. Run notification migration.')
    return
  }

  console.error('Notification error:', error)
}

export const create = async (input: CreateNotificationInput) => {
  try {
    const notification = repo().create({
      recipient_id: input.recipient_id,
      type: input.type,
      title: input.title,
      message: input.message,
      target_url: input.target_url ?? null,
      activity_log_id: input.activity_log_id ?? null,
      metadata: input.metadata ?? {},
    })

    return await repo().save(notification)
  } catch (error) {
    logNotificationError(error)
    return null
  }
}

export const createMany = async (inputs: CreateNotificationInput[]) => {
  try {
    const deduped = new Map<string, CreateNotificationInput>()

    inputs.forEach((input) => {
      deduped.set(`${input.recipient_id}:${input.type}:${input.target_url ?? ''}:${input.message}`, input)
    })

    const notifications = Array.from(deduped.values()).map((input) =>
      repo().create({
        recipient_id: input.recipient_id,
        type: input.type,
        title: input.title,
        message: input.message,
        target_url: input.target_url ?? null,
        activity_log_id: input.activity_log_id ?? null,
        metadata: input.metadata ?? {},
      })
    )

    if (notifications.length === 0) return []

    return await repo().save(notifications)
  } catch (error) {
    logNotificationError(error)
    return []
  }
}

export const getByUser = async (userId: string, page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safePage = Math.max(page, 1)
  const skip = (safePage - 1) * safeLimit

  let data: Notification[] = []
  let total = 0

  try {
    ;[data, total] = await repo()
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .skip(skip)
      .take(safeLimit)
      .getManyAndCount()
  } catch (error) {
    logNotificationError(error)
  }

  return {
    data,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  }
}

export const getUnreadCount = async (userId: string) => {
  try {
    return await repo()
      .createQueryBuilder('notification')
      .where('notification.recipient_id = :userId', { userId })
      .andWhere('notification.read_at IS NULL')
      .getCount()
  } catch (error) {
    logNotificationError(error)
    return 0
  }
}

export const markAllRead = async (userId: string) => {
  try {
    await repo()
      .createQueryBuilder()
      .update(Notification)
      .set({ read_at: () => 'CURRENT_TIMESTAMP' })
      .where('recipient_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute()
  } catch (error) {
    logNotificationError(error)
  }
}

export const markOneRead = async (userId: string, notificationId: string) => {
  try {
    await repo()
      .createQueryBuilder()
      .update(Notification)
      .set({ read_at: () => 'CURRENT_TIMESTAMP' })
      .where('id = :notificationId', { notificationId })
      .andWhere('recipient_id = :userId', { userId })
      .execute()
  } catch (error) {
    logNotificationError(error)
  }
}
