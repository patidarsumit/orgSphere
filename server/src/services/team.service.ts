import { CreateTeamInput, TeamQuery, UpdateTeamInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Team } from '../entities/Team'
import { User } from '../entities/User'

const repo = () => AppDataSource.getRepository(Team)
const userRepo = () => AppDataSource.getRepository(User)

export const findAll = async (query: TeamQuery) => {
  const { page, limit, search } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .select([
      'team.id',
      'team.name',
      'team.description',
      'team.created_by',
      'team.created_at',
      'team.updated_at',
      'member.id',
      'member.name',
      'member.email',
      'member.avatar_path',
      'member.role',
      'member.department',
    ])
    .skip(skip)
    .take(limit)
    .orderBy('team.created_at', 'DESC')
    .addOrderBy('member.name', 'ASC')

  if (search) {
    qb = qb.where('team.name ILIKE :search', { search: `%${search}%` })
  }

  const [teams, total] = await qb.getManyAndCount()

  return {
    data: teams,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .leftJoinAndSelect('team.creator', 'creator')
    .select([
      'team.id',
      'team.name',
      'team.description',
      'team.created_by',
      'team.created_at',
      'team.updated_at',
      'member.id',
      'member.name',
      'member.email',
      'member.avatar_path',
      'member.role',
      'member.department',
      'creator.id',
      'creator.name',
      'creator.email',
      'creator.avatar_path',
      'creator.role',
      'creator.department',
    ])
    .where('team.id = :id', { id })
    .orderBy('member.name', 'ASC')
    .getOne()
}

export const create = async (input: CreateTeamInput, creatorId: string) => {
  const team = repo().create({
    name: input.name,
    description: input.description || null,
    created_by: creatorId,
  })
  const saved = await repo().save(team)
  const creator = await userRepo().findOne({ where: { id: creatorId, is_active: true } })

  if (creator) {
    saved.members = [creator]
    await repo().save(saved)
  }

  return findById(saved.id)
}

export const update = async (id: string, input: UpdateTeamInput) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')

  Object.assign(team, input)
  return repo().save(team)
}

export const remove = async (id: string) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')

  await repo().remove(team)
}

export const addMember = async (teamId: string, userId: string) => {
  const team = await repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .where('team.id = :id', { id: teamId })
    .getOne()

  if (!team) throw new Error('TEAM_NOT_FOUND')

  const user = await userRepo().findOne({ where: { id: userId, is_active: true } })
  if (!user) throw new Error('USER_NOT_FOUND')

  if (team.members.some((member) => member.id === userId)) {
    throw new Error('ALREADY_MEMBER')
  }

  team.members = [...team.members, user]
  await repo().save(team)
  return findById(teamId)
}

export const removeMember = async (teamId: string, userId: string) => {
  const team = await repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .where('team.id = :id', { id: teamId })
    .getOne()

  if (!team) throw new Error('TEAM_NOT_FOUND')

  team.members = team.members.filter((member) => member.id !== userId)
  await repo().save(team)
}

export const getTeamsByUserId = async (userId: string) => {
  return repo()
    .createQueryBuilder('team')
    .innerJoin('team.members', 'member', 'member.id = :userId', { userId })
    .leftJoinAndSelect('team.members', 'allMembers')
    .select([
      'team.id',
      'team.name',
      'team.description',
      'team.created_by',
      'team.created_at',
      'team.updated_at',
      'allMembers.id',
      'allMembers.name',
      'allMembers.avatar_path',
      'allMembers.role',
      'allMembers.department',
    ])
    .orderBy('team.name', 'ASC')
    .getMany()
}
