import { AppDataSource } from '../data-source'

export type ProjectHealthStatus = 'healthy' | 'attention' | 'at_risk'

export interface ProjectHealthSignal {
  projectId: string
  projectName: string
  status: ProjectHealthStatus
  score: number
  completionPercent: number
  totalTasks: number
  openTasks: number
  overdueTasks: number
  highPriorityOpenTasks: number
  staleDays: number | null
  missingOwnership: string[]
  reasons: string[]
}

type ProjectHealthRow = {
  projectId: string
  projectName: string
  projectStatus: string
  managerId: string | null
  techLeadId: string | null
  teamId: string | null
  memberCount: string | number
  totalTasks: string | number
  doneTasks: string | number
  openTasks: string | number
  overdueTasks: string | number
  highPriorityOpenTasks: string | number
  lastMovementAt: Date | string | null
}

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0)

const daysSince = (value: Date | string | null) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

const inactiveProjectStatuses = new Set(['completed', 'archived'])

const statusForScore = (score: number): ProjectHealthStatus => {
  if (score < 55) return 'at_risk'
  if (score < 80) return 'attention'
  return 'healthy'
}

const getProjectHealthRows = async (projectId?: string) => {
  const projectFilter = projectId ? 'WHERE project.id = $1' : ''
  const params = projectId ? [projectId] : []

  return AppDataSource.manager.query(
    `
      SELECT
        project.id AS "projectId",
        project.name AS "projectName",
        project.status AS "projectStatus",
        project.manager_id AS "managerId",
        project.tech_lead_id AS "techLeadId",
        project.team_id AS "teamId",
        COUNT(DISTINCT project_member.id) AS "memberCount",
        COUNT(DISTINCT task.id) AS "totalTasks",
        COUNT(DISTINCT task.id) FILTER (WHERE task.status = 'done') AS "doneTasks",
        COUNT(DISTINCT task.id) FILTER (WHERE task.status <> 'done') AS "openTasks",
        COUNT(DISTINCT task.id) FILTER (
          WHERE task.status <> 'done'
            AND task.due_date IS NOT NULL
            AND task.due_date < CURRENT_DATE
        ) AS "overdueTasks",
        COUNT(DISTINCT task.id) FILTER (
          WHERE task.status <> 'done'
            AND task.priority = 'high'
        ) AS "highPriorityOpenTasks",
        GREATEST(project.updated_at, COALESCE(MAX(task.updated_at), project.updated_at)) AS "lastMovementAt"
      FROM projects project
      LEFT JOIN project_members project_member ON project_member.project_id = project.id
      LEFT JOIN tasks task ON task.project_id = project.id
      ${projectFilter}
      GROUP BY project.id
      ORDER BY project.created_at DESC
    `,
    params
  ) as Promise<ProjectHealthRow[]>
}

const scoreProject = (row: ProjectHealthRow): ProjectHealthSignal => {
  const totalTasks = toNumber(row.totalTasks)
  const doneTasks = toNumber(row.doneTasks)
  const openTasks = toNumber(row.openTasks)
  const overdueTasks = toNumber(row.overdueTasks)
  const highPriorityOpenTasks = toNumber(row.highPriorityOpenTasks)
  const memberCount = toNumber(row.memberCount)
  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const staleDays = daysSince(row.lastMovementAt)
  const isInactive = inactiveProjectStatuses.has(row.projectStatus)

  let score = 100
  const reasons: string[] = []
  const missingOwnership: string[] = []

  if (!row.managerId) missingOwnership.push('manager')
  if (!row.techLeadId) missingOwnership.push('tech lead')
  if (!row.teamId) missingOwnership.push('team')
  if (memberCount === 0) missingOwnership.push('members')

  if (missingOwnership.length > 0) {
    const penalty = Math.min(missingOwnership.length * 8, 24)
    score -= penalty
    reasons.push(`Missing ${missingOwnership.join(', ')}`)
  }

  if (!isInactive && overdueTasks > 0) {
    score -= Math.min(overdueTasks * 12, 36)
    reasons.push(`${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`)
  }

  if (!isInactive && highPriorityOpenTasks > 0) {
    score -= Math.min(highPriorityOpenTasks * 7, 21)
    reasons.push(`${highPriorityOpenTasks} high-priority open task${highPriorityOpenTasks === 1 ? '' : 's'}`)
  }

  if (!isInactive && staleDays !== null && staleDays >= 14) {
    score -= staleDays >= 30 ? 24 : 14
    reasons.push(`No movement in ${staleDays} days`)
  }

  if (!isInactive && totalTasks === 0) {
    score -= 10
    reasons.push('No tasks tracked yet')
  }

  const normalizedScore = Math.max(0, Math.min(100, score))

  return {
    projectId: row.projectId,
    projectName: row.projectName,
    status: statusForScore(normalizedScore),
    score: normalizedScore,
    completionPercent,
    totalTasks,
    openTasks,
    overdueTasks,
    highPriorityOpenTasks,
    staleDays,
    missingOwnership,
    reasons: reasons.length > 0 ? reasons : ['No active risk signals'],
  }
}

export const getProjectsHealth = async () => {
  const rows = await getProjectHealthRows()
  const projects = rows.map(scoreProject)

  return {
    summary: {
      healthy: projects.filter((project) => project.status === 'healthy').length,
      attention: projects.filter((project) => project.status === 'attention').length,
      atRisk: projects.filter((project) => project.status === 'at_risk').length,
      total: projects.length,
    },
    projects,
  }
}

export const getProjectHealth = async (projectId: string) => {
  const rows = await getProjectHealthRows(projectId)
  const row = rows[0]
  return row ? scoreProject(row) : null
}
