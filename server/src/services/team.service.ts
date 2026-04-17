import { CreateTeamInput, TeamQuery, UpdateTeamInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Team } from '../entities/Team'
import { Project } from '../entities/Project'
import { User } from '../entities/User'
import * as ActivityService from './activity.service'

const repo = () => AppDataSource.getRepository(Team)
const userRepo = () => AppDataSource.getRepository(User)
const projectRepo = () => AppDataSource.getRepository(Project)

const attachProjectCounts = async <T extends Team>(teams: T[]) => {
  const teamIds = teams.map((team) => team.id)

  if (teamIds.length === 0) {
    return teams
  }

  const rows = await projectRepo()
    .createQueryBuilder('project')
    .select('project.team_id', 'team_id')
    .addSelect('COUNT(project.id)', 'count')
    .where('project.team_id IN (:...teamIds)', { teamIds })
    .groupBy('project.team_id')
    .getRawMany<{ team_id: string; count: string }>()
  const countsByTeamId = new Map(rows.map((row) => [row.team_id, Number(row.count)]))

  teams.forEach((team) => {
    team.projects_count = countsByTeamId.get(team.id) || 0
  })

  return teams
}

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
  await attachProjectCounts(teams)

  return {
    data: teams,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  const team = await repo()
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

  if (team) {
    await attachProjectCounts([team])
  }

  return team
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

  await ActivityService.log({
    action: 'created',
    entity_type: 'team',
    entity_id: saved.id,
    entity_name: saved.name,
    actor_id: creatorId,
  })
  return findById(saved.id)
}

export const update = async (id: string, input: UpdateTeamInput, actorId?: string) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')

  Object.assign(team, input)
  const saved = await repo().save(team)
  await ActivityService.log({
    action: 'updated',
    entity_type: 'team',
    entity_id: id,
    entity_name: saved.name,
    actor_id: actorId,
  })
  return saved
}

export const remove = async (id: string, actorId?: string) => {
  const team = await repo().findOne({ where: { id } })
  if (!team) throw new Error('NOT_FOUND')

  await repo().remove(team)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'team',
    entity_id: id,
    entity_name: team.name,
    actor_id: actorId,
  })
}

export const addMember = async (teamId: string, userId: string, actorId?: string) => {
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
  await ActivityService.log({
    action: 'member_added',
    entity_type: 'team_member',
    entity_id: teamId,
    entity_name: team.name,
    actor_id: actorId,
    metadata: { member_name: user.name, member_id: userId },
  })
  return findById(teamId)
}

export const removeMember = async (teamId: string, userId: string, actorId?: string) => {
  const team = await repo()
    .createQueryBuilder('team')
    .leftJoinAndSelect('team.members', 'member')
    .where('team.id = :id', { id: teamId })
    .getOne()

  if (!team) throw new Error('TEAM_NOT_FOUND')

  const removedUser = team.members.find((member) => member.id === userId)
  team.members = team.members.filter((member) => member.id !== userId)
  await repo().save(team)
  await ActivityService.log({
    action: 'member_removed',
    entity_type: 'team_member',
    entity_id: teamId,
    entity_name: team.name,
    actor_id: actorId,
    metadata: { member_name: removedUser?.name ?? 'a member', member_id: userId },
  })
}

export const getTeamsByUserId = async (userId: string) => {
  const teams = await repo()
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

  return attachProjectCounts(teams)
}
