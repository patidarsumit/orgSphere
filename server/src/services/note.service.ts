import { CreateNoteInput, NoteQuery, UpdateNoteInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Note } from '../entities/Note'
import * as ActivityService from './activity.service'

const repo = () => AppDataSource.getRepository(Note)

export const findByUser = async (userId: string, query: NoteQuery) => {
  const { page, limit, search, tag, project_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('note')
    .leftJoin('note.project', 'project')
    .select([
      'note.id',
      'note.title',
      'note.tags',
      'note.user_id',
      'note.project_id',
      'note.created_at',
      'note.updated_at',
      'project.id',
      'project.name',
    ])
    .where('note.user_id = :userId', { userId })
    .orderBy('note.updated_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (search) {
    qb = qb.andWhere('note.title ILIKE :search', { search: `%${search}%` })
  }
  if (tag) {
    qb = qb.andWhere('note.tags::text ILIKE :tag', { tag: `%${tag}%` })
  }
  if (project_id) {
    qb = qb.andWhere('note.project_id = :project_id', { project_id })
  }

  const [notes, total] = await qb.getManyAndCount()

  return {
    data: notes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string, userId: string) => {
  return repo()
    .createQueryBuilder('note')
    .leftJoinAndSelect('note.project', 'project')
    .where('note.id = :id AND note.user_id = :userId', { id, userId })
    .getOne()
}

export const create = async (input: CreateNoteInput, userId: string) => {
  const note = repo().create({
    ...input,
    title: input.title || 'Untitled note',
    project_id: input.project_id || null,
    user_id: userId,
  })
  const saved = await repo().save(note)
  await ActivityService.log({
    action: 'created',
    entity_type: 'note',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: userId,
  })
  return findById(saved.id, userId)
}

export const update = async (id: string, userId: string, input: UpdateNoteInput) => {
  const note = await repo().findOne({ where: { id, user_id: userId } })
  if (!note) throw new Error('NOT_FOUND')

  Object.assign(note, {
    ...input,
    project_id: input.project_id === undefined ? note.project_id : input.project_id || null,
  })
  await repo().save(note)
  return findById(id, userId)
}

export const remove = async (id: string, userId: string) => {
  const note = await repo().findOne({ where: { id, user_id: userId } })
  if (!note) throw new Error('NOT_FOUND')

  await repo().remove(note)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'note',
    entity_id: id,
    entity_name: note.title,
    actor_id: userId,
  })
}

export const countByUser = async (userId: string) => {
  return repo().count({ where: { user_id: userId } })
}

export const getRecentByUser = async (userId: string, limit = 3) => {
  return repo()
    .createQueryBuilder('note')
    .leftJoin('note.project', 'project')
    .select([
      'note.id',
      'note.title',
      'note.content',
      'note.tags',
      'note.user_id',
      'note.project_id',
      'note.updated_at',
      'project.id',
      'project.name',
    ])
    .where('note.user_id = :userId', { userId })
    .orderBy('note.updated_at', 'DESC')
    .take(limit)
    .getMany()
}
