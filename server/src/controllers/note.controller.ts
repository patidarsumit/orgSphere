import { Response } from 'express'
import { ZodError } from 'zod'
import { noteQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'
import * as NoteService from '../services/note.service'
import { routeParam } from '../utils/request'

const sendServerError = (res: Response, message: string) => {
  res.status(500).json({ message })
}

export const getMyNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = noteQuerySchema.parse(req.query)
    const result = await NoteService.findByUser(req.user!.id, query)
    res.json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Invalid note query', errors: error.flatten().fieldErrors })
      return
    }
    sendServerError(res, 'Failed to fetch notes')
  }
}

export const getRecent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await NoteService.getRecentByUser(req.user!.id, 3)
    res.json(notes)
  } catch {
    sendServerError(res, 'Failed to fetch recent notes')
  }
}

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.findById(routeParam(req.params.id), req.user!.id)
    if (!note) {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    res.json(note)
  } catch {
    sendServerError(res, 'Failed to fetch note')
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.create(req.body, req.user!.id)
    res.status(201).json(note)
  } catch {
    sendServerError(res, 'Failed to create note')
  }
}

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await NoteService.update(routeParam(req.params.id), req.user!.id, req.body)
    res.json(note)
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    sendServerError(res, 'Failed to update note')
  }
}

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await NoteService.remove(routeParam(req.params.id), req.user!.id)
    res.json({ message: 'Note deleted' })
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Note not found' })
      return
    }
    sendServerError(res, 'Failed to delete note')
  }
}
