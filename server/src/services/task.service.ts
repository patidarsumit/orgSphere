import { CreateTaskInput, TaskQuery, UpdateTaskInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Task } from '../entities/Task'
import * as ActivityService from './activity.service'

const repo = () => AppDataSource.getRepository(Task)

export const findByUser = async (userId: string, query: TaskQuery) => {
  const { page, limit, status, priority, project_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('task')
    .leftJoin('task.project', 'project')
    .select([
      'task.id',
      'task.title',
      'task.description',
      'task.status',
      'task.priority',
      'task.due_date',
      'task.assigned_to',
      'task.project_id',
      'task.created_by',
      'task.created_at',
      'task.updated_at',
      'project.id',
      'project.name',
    ])
    .where('task.assigned_to = :userId', { userId })
    .orderBy('task.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (status) qb = qb.andWhere('task.status = :status', { status })
  if (priority) qb = qb.andWhere('task.priority = :priority', { priority })
  if (project_id) qb = qb.andWhere('task.project_id = :project_id', { project_id })

  const [tasks, total] = await qb.getManyAndCount()

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findByProject = async (projectId: string, query: TaskQuery) => {
  const { page, limit, status, priority } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('task')
    .leftJoin('task.project', 'project')
    .leftJoin('task.assignee', 'assignee')
    .select([
      'task.id',
      'task.title',
      'task.description',
      'task.status',
      'task.priority',
      'task.due_date',
      'task.assigned_to',
      'task.project_id',
      'task.created_by',
      'task.created_at',
      'task.updated_at',
      'project.id',
      'project.name',
      'assignee.id',
      'assignee.name',
      'assignee.avatar_path',
      'assignee.email',
      'assignee.role',
      'assignee.department',
    ])
    .where('task.project_id = :projectId', { projectId })
    .orderBy('task.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (status) qb = qb.andWhere('task.status = :status', { status })
  if (priority) qb = qb.andWhere('task.priority = :priority', { priority })

  const [tasks, total] = await qb.getManyAndCount()

  return {
    data: tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string, userId: string) => {
  return repo()
    .createQueryBuilder('task')
    .leftJoinAndSelect('task.project', 'project')
    .leftJoinAndSelect('task.assignee', 'assignee')
    .where('task.id = :id AND task.assigned_to = :userId', { id, userId })
    .getOne()
}

export const create = async (input: CreateTaskInput, userId: string) => {
  const task = repo().create({
    ...input,
    description: input.description || null,
    due_date: input.due_date || null,
    project_id: input.project_id || null,
    assigned_to: userId,
    created_by: userId,
  })
  const saved = await repo().save(task)
  await ActivityService.log({
    action: 'created',
    entity_type: 'task',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: userId,
  })
  return findById(saved.id, userId)
}

export const update = async (id: string, userId: string, input: UpdateTaskInput) => {
  const task = await repo().findOne({
    where: { id, assigned_to: userId },
  })
  if (!task) throw new Error('NOT_FOUND')

  const oldStatus = task.status
  Object.assign(task, {
    ...input,
    description: input.description === undefined ? task.description : input.description,
    due_date: input.due_date === undefined ? task.due_date : input.due_date || null,
    project_id: input.project_id === undefined ? task.project_id : input.project_id || null,
  })
  await repo().save(task)
  if (input.status === 'done' && oldStatus !== 'done') {
    await ActivityService.log({
      action: 'completed',
      entity_type: 'task',
      entity_id: id,
      entity_name: task.title,
      actor_id: userId,
    })
  } else if (input.status && input.status !== oldStatus) {
    await ActivityService.log({
      action: 'status_changed',
      entity_type: 'task',
      entity_id: id,
      entity_name: task.title,
      actor_id: userId,
      metadata: { old_status: oldStatus, new_status: input.status },
    })
  } else {
    await ActivityService.log({
      action: 'updated',
      entity_type: 'task',
      entity_id: id,
      entity_name: task.title,
      actor_id: userId,
    })
  }
  return findById(id, userId)
}

export const remove = async (id: string, userId: string) => {
  const task = await repo().findOne({
    where: { id, assigned_to: userId },
  })
  if (!task) throw new Error('NOT_FOUND')

  await repo().remove(task)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'task',
    entity_id: id,
    entity_name: task.title,
    actor_id: userId,
  })
}

export const countOpenByUser = async (userId: string) => {
  return repo().count({
    where: [
      { assigned_to: userId, status: 'todo' },
      { assigned_to: userId, status: 'in_progress' },
      { assigned_to: userId, status: 'review' },
    ],
  })
}

export const getTodayByUser = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0]

  return repo()
    .createQueryBuilder('task')
    .leftJoin('task.project', 'project')
    .select([
      'task.id',
      'task.title',
      'task.status',
      'task.priority',
      'task.due_date',
      'task.assigned_to',
      'task.project_id',
      'task.created_at',
      'project.id',
      'project.name',
    ])
    .where('task.assigned_to = :userId', { userId })
    .andWhere('(task.due_date = :today OR task.status IN (:...activeStatuses))', {
      today,
      activeStatuses: ['in_progress', 'review'],
    })
    .andWhere('task.status != :doneStatus', { doneStatus: 'done' })
    .orderBy('task.due_date', 'ASC', 'NULLS LAST')
    .addOrderBy('task.created_at', 'DESC')
    .take(10)
    .getMany()
}
