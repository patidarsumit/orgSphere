import bcrypt from 'bcryptjs'
import { CreateEmployeeInput, EmployeeQuery, UpdateEmployeeInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { User } from '../entities/User'
import * as ActivityService from './activity.service'

const repo = () => AppDataSource.getRepository(User)

export const sanitize = (user: User) => {
  const { password_hash: _passwordHash, ...safe } = user
  return safe
}

export const findAll = async (query: EmployeeQuery) => {
  const { page, limit, search, role, skill, department, is_active } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.manager', 'manager')
    .select([
      'user.id',
      'user.name',
      'user.email',
      'user.role',
      'user.department',
      'user.skills',
      'user.avatar_path',
      'user.manager_id',
      'user.is_active',
      'user.created_at',
      'user.updated_at',
      'manager.id',
      'manager.name',
      'manager.avatar_path',
      'manager.role',
      'manager.department',
    ])
    .skip(skip)
    .take(limit)
    .orderBy('user.created_at', 'DESC')

  if (search) {
    qb = qb.where('(user.name ILIKE :search OR user.email ILIKE :search)', {
      search: `%${search}%`,
    })
  }

  if (role) qb = qb.andWhere('user.role = :role', { role })
  if (is_active !== undefined) qb = qb.andWhere('user.is_active = :is_active', { is_active })
  if (department) qb = qb.andWhere('user.department ILIKE :department', { department: `%${department}%` })
  if (skill) qb = qb.andWhere('user.skills::text ILIKE :skill', { skill: `%${skill}%` })

  const [users, total] = await qb.getManyAndCount()

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.manager', 'manager')
    .leftJoinAndSelect('user.direct_reports', 'reports', 'reports.is_active = true')
    .select([
      'user.id',
      'user.name',
      'user.email',
      'user.role',
      'user.department',
      'user.skills',
      'user.avatar_path',
      'user.manager_id',
      'user.is_active',
      'user.created_at',
      'user.updated_at',
      'manager.id',
      'manager.name',
      'manager.email',
      'manager.avatar_path',
      'manager.role',
      'manager.department',
      'reports.id',
      'reports.name',
      'reports.email',
      'reports.avatar_path',
      'reports.role',
      'reports.department',
    ])
    .where('user.id = :id', { id })
    .getOne()
}

export const create = async (input: CreateEmployeeInput, actorId?: string) => {
  const existing = await repo().findOne({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_EXISTS')

  const password_hash = await bcrypt.hash(input.password, 12)
  const user = repo().create({
    ...input,
    department: input.department || null,
    manager_id: input.manager_id || null,
    password_hash,
  })
  const saved = await repo().save(user)
  await ActivityService.log({
    action: 'created',
    entity_type: 'employee',
    entity_id: saved.id,
    entity_name: saved.name,
    actor_id: actorId,
  })
  return saved
}

export const update = async (id: string, input: UpdateEmployeeInput, actorId?: string) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  Object.assign(user, input)
  const saved = await repo().save(user)
  await ActivityService.log({
    action: 'updated',
    entity_type: 'employee',
    entity_id: id,
    entity_name: saved.name,
    actor_id: actorId,
  })
  return saved
}

export const updateAvatar = async (id: string, avatarPath: string, actorId?: string) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  const result = await repo().update(id, { avatar_path: avatarPath })
  if (!result.affected) throw new Error('NOT_FOUND')
  await ActivityService.log({
    action: 'uploaded',
    entity_type: 'employee',
    entity_id: id,
    entity_name: user.name,
    actor_id: actorId,
  })
}

export const remove = async (id: string, actorId?: string) => {
  const user = await repo().findOne({ where: { id } })
  if (!user) throw new Error('NOT_FOUND')

  user.is_active = false
  const saved = await repo().save(user)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'employee',
    entity_id: id,
    entity_name: saved.name,
    actor_id: actorId,
  })
  return saved
}

export const getDirectReports = async (managerId: string) => {
  return repo().find({
    where: { manager_id: managerId, is_active: true },
    select: ['id', 'name', 'email', 'role', 'avatar_path', 'department'],
  })
}

export const getUniqueSkills = async () => {
  const users = await repo()
    .createQueryBuilder('user')
    .select(['user.id', 'user.skills'])
    .where('user.is_active = true')
    .getMany()

  return Array.from(new Set(users.flatMap((user) => user.skills))).sort((a, b) =>
    a.localeCompare(b)
  )
}
