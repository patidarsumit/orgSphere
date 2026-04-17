import {
  AddProjectMemberInput,
  CreateProjectInput,
  ProjectQuery,
  UpdateProjectInput,
} from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Project } from '../entities/Project'
import { ProjectMember } from '../entities/ProjectMember'
import { User } from '../entities/User'
import * as ActivityService from './activity.service'

const repo = () => AppDataSource.getRepository(Project)
const pmRepo = () => AppDataSource.getRepository(ProjectMember)
const userRepo = () => AppDataSource.getRepository(User)

const canCreateProject = (actorRole?: string) => actorRole === 'admin' || actorRole === 'manager'

const ensureCanManageProject = (project: Project, actorId?: string, actorRole?: string) => {
  if (!actorId) throw new Error('FORBIDDEN')
  if (actorRole === 'admin') return
  if (project.manager_id === actorId || project.tech_lead_id === actorId) return
  throw new Error('FORBIDDEN')
}

const projectFields = [
  'project.id',
  'project.name',
  'project.description',
  'project.status',
  'project.tech_stack',
  'project.start_date',
  'project.manager_id',
  'project.tech_lead_id',
  'project.team_id',
  'project.created_at',
  'project.updated_at',
]

const relationFields = [
  'manager.id',
  'manager.name',
  'manager.email',
  'manager.role',
  'manager.department',
  'manager.avatar_path',
  'lead.id',
  'lead.name',
  'lead.email',
  'lead.role',
  'lead.department',
  'lead.avatar_path',
  'team.id',
  'team.name',
  'team.description',
  'pm.id',
  'pm.project_id',
  'pm.user_id',
  'pm.role',
  'pm.joined_at',
  'member.id',
  'member.name',
  'member.email',
  'member.role',
  'member.department',
  'member.avatar_path',
]

export const findAll = async (query: ProjectQuery) => {
  const { page, limit, search, status, tech, team_id, manager_id } = query
  const skip = (page - 1) * limit

  let baseQb = repo()
    .createQueryBuilder('project')
    .leftJoin('project.manager', 'manager')
    .leftJoin('project.tech_lead', 'lead')
    .orderBy('project.created_at', 'DESC')

  if (search) {
    baseQb = baseQb.andWhere(
      '(project.name ILIKE :search OR manager.name ILIKE :search OR lead.name ILIKE :search)',
      { search: `%${search}%` }
    )
  }
  if (status) {
    baseQb = baseQb.andWhere('project.status = :status', { status })
  }
  if (tech) {
    baseQb = baseQb.andWhere("project.tech_stack::text ILIKE :tech", { tech: `%${tech}%` })
  }
  if (team_id) {
    baseQb = baseQb.andWhere('project.team_id = :team_id', { team_id })
  }
  if (manager_id) {
    baseQb = baseQb.andWhere('project.manager_id = :manager_id', { manager_id })
  }

  const total = await baseQb.getCount()
  const idRows = await baseQb
    .clone()
    .select('project.id', 'id')
    .skip(skip)
    .take(limit)
    .getRawMany<{ id: string }>()
  const ids = idRows.map((row) => row.id)

  const projects =
    ids.length > 0
      ? await repo()
          .createQueryBuilder('project')
          .leftJoinAndSelect('project.manager', 'manager')
          .leftJoinAndSelect('project.tech_lead', 'lead')
          .leftJoinAndSelect('project.team', 'team')
          .leftJoinAndSelect('project.project_members', 'pm')
          .leftJoinAndSelect('pm.user', 'member')
          .select([...projectFields, ...relationFields])
          .where('project.id IN (:...ids)', { ids })
          .orderBy('project.created_at', 'DESC')
          .addOrderBy('member.name', 'ASC')
          .getMany()
      : []

  return {
    data: projects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.manager', 'manager')
    .leftJoinAndSelect('project.tech_lead', 'lead')
    .leftJoinAndSelect('project.team', 'team')
    .leftJoinAndSelect('project.project_members', 'pm')
    .leftJoinAndSelect('pm.user', 'member')
    .select([...projectFields, ...relationFields])
    .where('project.id = :id', { id })
    .orderBy('member.name', 'ASC')
    .getOne()
}

export const findByUserId = async (userId: string) => {
  return pmRepo()
    .createQueryBuilder('pm')
    .innerJoinAndSelect('pm.project', 'project')
    .leftJoinAndSelect('project.team', 'team')
    .where('pm.user_id = :userId', { userId })
    .select([
      'pm.id',
      'pm.project_id',
      'pm.user_id',
      'pm.role',
      'pm.joined_at',
      'project.id',
      'project.name',
      'project.description',
      'project.status',
      'project.tech_stack',
      'project.start_date',
      'team.id',
      'team.name',
    ])
    .orderBy('project.name', 'ASC')
    .getMany()
}

export const findByTeamId = async (teamId: string) => {
  return repo()
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.manager', 'manager')
    .leftJoinAndSelect('project.tech_lead', 'lead')
    .leftJoinAndSelect('project.team', 'team')
    .where('project.team_id = :teamId', { teamId })
    .select([
      ...projectFields,
      'manager.id',
      'manager.name',
      'manager.avatar_path',
      'lead.id',
      'lead.name',
      'lead.avatar_path',
      'team.id',
      'team.name',
    ])
    .orderBy('project.created_at', 'DESC')
    .getMany()
}

export const create = async (input: CreateProjectInput, actorId?: string, actorRole?: string) => {
  if (!canCreateProject(actorRole)) throw new Error('FORBIDDEN')

  const project = repo().create({
    ...input,
    description: input.description || null,
    start_date: input.start_date || null,
    manager_id: input.manager_id || null,
    tech_lead_id: input.tech_lead_id || null,
    team_id: input.team_id || null,
  })
  const saved = await repo().save(project)
  await ActivityService.log({
    action: 'created',
    entity_type: 'project',
    entity_id: saved.id,
    entity_name: saved.name,
    actor_id: actorId,
  })
  return findById(saved.id)
}

export const update = async (
  id: string,
  input: UpdateProjectInput,
  actorId?: string,
  actorRole?: string
) => {
  const project = await repo().findOne({ where: { id } })
  if (!project) throw new Error('NOT_FOUND')
  ensureCanManageProject(project, actorId, actorRole)

  const oldStatus = project.status
  Object.assign(project, input)
  const saved = await repo().save(project)
  await ActivityService.log({
    action: input.status && input.status !== oldStatus ? 'status_changed' : 'updated',
    entity_type: 'project',
    entity_id: id,
    entity_name: saved.name,
    actor_id: actorId,
    metadata:
      input.status && input.status !== oldStatus
        ? { old_status: oldStatus, new_status: input.status }
        : {},
  })
  return findById(saved.id)
}

export const remove = async (id: string, actorId?: string, actorRole?: string) => {
  const project = await repo().findOne({ where: { id } })
  if (!project) throw new Error('NOT_FOUND')
  if (actorRole !== 'admin') throw new Error('FORBIDDEN')

  await repo().remove(project)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'project',
    entity_id: id,
    entity_name: project.name,
    actor_id: actorId,
  })
}

export const addMember = async (
  projectId: string,
  input: AddProjectMemberInput,
  actorId?: string,
  actorRole?: string
) => {
  const project = await repo().findOne({ where: { id: projectId } })
  if (!project) throw new Error('PROJECT_NOT_FOUND')
  ensureCanManageProject(project, actorId, actorRole)

  const user = await userRepo().findOne({ where: { id: input.user_id, is_active: true } })
  if (!user) throw new Error('USER_NOT_FOUND')

  const existing = await pmRepo().findOne({
    where: { project_id: projectId, user_id: input.user_id },
  })
  if (existing) throw new Error('ALREADY_MEMBER')

  await pmRepo().save(
    pmRepo().create({
      project_id: projectId,
      user_id: input.user_id,
      role: input.role,
    })
  )

  await ActivityService.log({
    action: 'member_added',
    entity_type: 'project_member',
    entity_id: projectId,
    entity_name: project.name,
    actor_id: actorId,
    metadata: { member_name: user.name, member_id: input.user_id, role: input.role },
  })
  return findById(projectId)
}

export const removeMember = async (
  projectId: string,
  userId: string,
  actorId?: string,
  actorRole?: string
) => {
  const project = await repo().findOne({ where: { id: projectId } })
  if (!project) throw new Error('PROJECT_NOT_FOUND')
  ensureCanManageProject(project, actorId, actorRole)
  const user = await userRepo().findOne({ where: { id: userId } })
  const projectMember = await pmRepo().findOne({
    where: { project_id: projectId, user_id: userId },
  })
  if (!projectMember) throw new Error('NOT_FOUND')

  await pmRepo().remove(projectMember)
  await ActivityService.log({
    action: 'member_removed',
    entity_type: 'project_member',
    entity_id: projectId,
    entity_name: project?.name ?? 'project',
    actor_id: actorId,
    metadata: { member_name: user?.name ?? 'a member', member_id: userId },
  })
}

export const updateMemberRole = async (
  projectId: string,
  userId: string,
  role: string,
  actorId?: string,
  actorRole?: string
) => {
  const project = await repo().findOne({ where: { id: projectId } })
  if (!project) throw new Error('PROJECT_NOT_FOUND')
  ensureCanManageProject(project, actorId, actorRole)

  const projectMember = await pmRepo().findOne({
    where: { project_id: projectId, user_id: userId },
  })
  if (!projectMember) throw new Error('NOT_FOUND')

  projectMember.role = role
  await pmRepo().save(projectMember)
  return findById(projectId)
}

export const getRecentProjects = async (limit = 5) => {
  const idRows = await repo()
    .createQueryBuilder('project')
    .select('project.id', 'id')
    .orderBy('project.created_at', 'DESC')
    .take(limit)
    .getRawMany<{ id: string }>()
  const ids = idRows.map((row) => row.id)

  if (ids.length === 0) {
    return []
  }

  return repo()
    .createQueryBuilder('project')
    .leftJoinAndSelect('project.manager', 'manager')
    .leftJoinAndSelect('project.tech_lead', 'lead')
    .leftJoinAndSelect('project.team', 'team')
    .leftJoinAndSelect('project.project_members', 'pm')
    .leftJoinAndSelect('pm.user', 'member')
    .select([...projectFields, ...relationFields])
    .where('project.id IN (:...ids)', { ids })
    .orderBy('project.created_at', 'DESC')
    .addOrderBy('member.name', 'ASC')
    .getMany()
}
