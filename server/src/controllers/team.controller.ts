import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { teamQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as TeamService from '../services/team.service'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = teamQuerySchema.parse(req.query)
    const result = await TeamService.findAll(query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid team query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch teams')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.findById(req.params.id)
    if (!team) {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    res.json(team)
  } catch {
    sendServerError(res, 'Failed to fetch team')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creatorId = req.user?.id
    if (!creatorId) {
      res.status(401).json({ message: 'No authenticated user' })
      return
    }

    const team = await TeamService.create(req.body, creatorId)
    res.status(201).json(team)
  } catch {
    sendServerError(res, 'Failed to create team')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.update(req.params.id, req.body)
    res.json(team)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    sendServerError(res, 'Failed to update team')
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await TeamService.remove(req.params.id)
    res.json({ message: 'Team deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    sendServerError(res, 'Failed to delete team')
  }
}

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await TeamService.addMember(req.params.id, req.body.user_id)
    res.json(team)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const statusByMessage: Record<string, number> = {
      TEAM_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      ALREADY_MEMBER: 409,
    }
    res.status(statusByMessage[message] || 500).json({ message })
  }
}

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    await TeamService.removeMember(req.params.id, req.params.userId)
    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'TEAM_NOT_FOUND') {
      res.status(404).json({ message: 'Team not found' })
      return
    }
    sendServerError(res, 'Failed to remove member')
  }
}

export const getByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await TeamService.getTeamsByUserId(req.params.userId)
    res.json(teams)
  } catch {
    sendServerError(res, 'Failed to fetch user teams')
  }
}
