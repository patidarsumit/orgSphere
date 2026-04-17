import { AppDataSource } from '../data-source'
import {
  ActivityAction,
  ActivityEntityType,
  ActivityLog,
} from '../entities/ActivityLog'

const repo = () => AppDataSource.getRepository(ActivityLog)

export interface LogActivityInput {
  action: ActivityAction
  entity_type: ActivityEntityType
  entity_id: string
  entity_name?: string | null
  actor_id?: string | null
  metadata?: Record<string, unknown>
}

export interface ActivityQuery {
  page?: number
  limit?: number
  entity_type?: ActivityEntityType
  entity_id?: string
  actor_id?: string
}

export const log = async (input: LogActivityInput): Promise<void> => {
  try {
    const entry = repo().create({
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_name: input.entity_name ?? null,
      actor_id: input.actor_id ?? null,
      metadata: input.metadata ?? {},
      read_by: [],
    })
    await repo().save(entry)
  } catch (error) {
    console.error('Activity log error:', error)
  }
}

export const getGlobalFeed = async (query: ActivityQuery = {}) => {
  const { page = 1, limit = 20, entity_type, entity_id, actor_id } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id',
      'log.action',
      'log.entity_type',
      'log.entity_id',
      'log.entity_name',
      'log.metadata',
      'log.read_by',
      'log.created_at',
      'actor.id',
      'actor.name',
      'actor.avatar_path',
      'actor.role',
    ])
    .orderBy('log.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (entity_type) qb = qb.andWhere('log.entity_type = :entity_type', { entity_type })
  if (entity_id) qb = qb.andWhere('log.entity_id = :entity_id', { entity_id })
  if (actor_id) qb = qb.andWhere('log.actor_id = :actor_id', { actor_id })

  const [logs, total] = await qb.getManyAndCount()

  return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const getEntityActivity = async (
  entityType: ActivityEntityType,
  entityId: string,
  limit = 20
) => {
  const relatedTypes =
    entityType === 'project'
      ? ['project', 'project_member']
      : entityType === 'team'
        ? ['team', 'team_member']
        : [entityType]

  return repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id',
      'log.action',
      'log.entity_type',
      'log.entity_id',
      'log.entity_name',
      'log.metadata',
      'log.created_at',
      'actor.id',
      'actor.name',
      'actor.avatar_path',
    ])
    .where('log.entity_id = :entityId', { entityId })
    .andWhere('log.entity_type IN (:...relatedTypes)', { relatedTypes })
    .orderBy('log.created_at', 'DESC')
    .take(limit)
    .getMany()
}

export const getUnreadCount = async (userId: string): Promise<number> => {
  return repo()
    .createQueryBuilder('log')
    .where('NOT (log.read_by ? :userId)', { userId })
    .andWhere('(log.actor_id IS NULL OR log.actor_id::text != :userId)', { userId })
    .andWhere("log.created_at > NOW() - INTERVAL '7 days'")
    .getCount()
}

export const markAllRead = async (userId: string): Promise<void> => {
  await AppDataSource.query(
    `
      UPDATE activity_logs
      SET read_by = read_by || $1::jsonb
      WHERE NOT (read_by ? $2)
        AND (actor_id IS NULL OR actor_id::text != $2)
    `,
    [JSON.stringify([userId]), userId]
  )
}

export const getRecentGlobal = async (limit = 10) => {
  return repo()
    .createQueryBuilder('log')
    .leftJoin('log.actor', 'actor')
    .select([
      'log.id',
      'log.action',
      'log.entity_type',
      'log.entity_id',
      'log.entity_name',
      'log.metadata',
      'log.created_at',
      'actor.id',
      'actor.name',
      'actor.avatar_path',
    ])
    .orderBy('log.created_at', 'DESC')
    .take(limit)
    .getMany()
}
