import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as ActivityService from '../services/activity.service'
import { formatMany } from '../utils/activity.formatter'
import { ActivityEntityType } from '../entities/ActivityLog'
import { routeParam } from '../utils/request'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getGlobalFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number.parseInt(String(req.query.page || '1'), 10)
    const limit = Number.parseInt(String(req.query.limit || '20'), 10)
    const result = await ActivityService.getGlobalFeed({
      page: Number.isNaN(page) ? 1 : page,
      limit: Number.isNaN(limit) ? 20 : Math.min(limit, 100),
      entity_type: req.query.entity_type as ActivityEntityType | undefined,
      entity_id: req.query.entity_id as string | undefined,
      actor_id: req.query.actor_id as string | undefined,
    })
    res.json({ ...result, data: formatMany(result.data) })
  } catch {
    sendServerError(res, 'Failed to fetch activity feed')
  }
}

export const getEntityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Number.parseInt(String(req.query.limit || '20'), 10)
    const logs = await ActivityService.getEntityActivity(
      routeParam(req.params.entity_type) as ActivityEntityType,
      routeParam(req.params.entity_id),
      Number.isNaN(limit) ? 20 : Math.min(limit, 100)
    )
    res.json(formatMany(logs))
  } catch {
    sendServerError(res, 'Failed to fetch entity activity')
  }
}

export const getRecentFeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await ActivityService.getRecentGlobal(10)
    res.json(formatMany(logs))
  } catch {
    sendServerError(res, 'Failed to fetch recent activity')
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await ActivityService.getUnreadCount(req.user!.id)
    res.json({ count })
  } catch {
    sendServerError(res, 'Failed to fetch unread count')
  }
}

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ActivityService.markAllRead(req.user!.id)
    res.json({ message: 'All notifications marked as read' })
  } catch {
    sendServerError(res, 'Failed to mark notifications as read')
  }
}
