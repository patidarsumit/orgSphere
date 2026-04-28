import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as NotificationService from '../services/notification.service'
import { routeParam } from '../utils/request'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Number.parseInt(String(req.query.page || '1'), 10)
    const limit = Number.parseInt(String(req.query.limit || '20'), 10)
    const result = await NotificationService.getByUser(
      req.user!.id,
      Number.isNaN(page) ? 1 : page,
      Number.isNaN(limit) ? 20 : limit
    )
    res.json(result)
  } catch {
    sendServerError(res, 'Failed to fetch notifications')
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!.id)
    res.json({ count })
  } catch {
    sendServerError(res, 'Failed to fetch unread notifications')
  }
}

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await NotificationService.markAllRead(req.user!.id)
    res.json({ message: 'All notifications marked as read' })
  } catch {
    sendServerError(res, 'Failed to mark notifications as read')
  }
}

export const markOneRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await NotificationService.markOneRead(req.user!.id, routeParam(req.params.id))
    res.json({ message: 'Notification marked as read' })
  } catch {
    sendServerError(res, 'Failed to mark notification as read')
  }
}
