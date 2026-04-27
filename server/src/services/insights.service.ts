import { AppDataSource } from '../data-source'

type CountRow = { count: string | number }

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0)

const countBy = <T extends string>(
  rows: Array<Record<T, string> & CountRow>,
  key: T
) => rows.map((row) => ({ key: row[key], label: row[key], value: toNumber(row.count) }))

export const getDashboardInsights = async () => {
  const manager = AppDataSource.manager
  const [
    projectStatusRows,
    taskStatusRows,
    taskPriorityRows,
    teamWorkload,
    activityTrend,
  ] = await Promise.all([
    manager.query(`
      SELECT status, COUNT(*) AS count
      FROM projects
      GROUP BY status
      ORDER BY status
    `),
    manager.query(`
      SELECT status, COUNT(*) AS count
      FROM tasks
      GROUP BY status
      ORDER BY status
    `),
    manager.query(`
      SELECT priority, COUNT(*) AS count
      FROM tasks
      GROUP BY priority
      ORDER BY priority
    `),
    manager.query(`
      SELECT
        COALESCE(team.id::text, 'unassigned') AS "teamId",
        COALESCE(team.name, 'Unassigned') AS "teamName",
        COUNT(task.id) AS "openTasks"
      FROM tasks task
      LEFT JOIN projects project ON project.id = task.project_id
      LEFT JOIN teams team ON team.id = project.team_id
      WHERE task.status <> 'done'
      GROUP BY team.id, team.name
      ORDER BY "openTasks" DESC, "teamName" ASC
      LIMIT 8
    `),
    manager.query(`
      SELECT
        TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
        COALESCE(activity.count, 0) AS count
      FROM generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS days(day)
      LEFT JOIN (
        SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS count
        FROM activity_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY DATE_TRUNC('day', created_at)
      ) activity ON activity.day = days.day
      ORDER BY days.day ASC
    `),
  ])

  return {
    projectStatus: countBy(projectStatusRows, 'status'),
    taskStatus: countBy(taskStatusRows, 'status'),
    taskPriority: countBy(taskPriorityRows, 'priority'),
    teamWorkload: teamWorkload.map(
      (row: { teamId: string; teamName: string; openTasks: string | number }) => ({
        teamId: row.teamId,
        teamName: row.teamName,
        openTasks: toNumber(row.openTasks),
      })
    ),
    activityTrend: activityTrend.map((row: { date: string; count: string | number }) => ({
      date: row.date,
      count: toNumber(row.count),
    })),
  }
}

export const getProjectsInsights = async () => {
  const manager = AppDataSource.manager
  const [
    projectStatusRows,
    projectsByTeam,
    techStackUsage,
    topProjectsByOpenTasks,
    projectCompletion,
  ] = await Promise.all([
    manager.query(`
      SELECT status, COUNT(*) AS count
      FROM projects
      GROUP BY status
      ORDER BY status
    `),
    manager.query(`
      SELECT
        COALESCE(team.id::text, 'unassigned') AS "teamId",
        COALESCE(team.name, 'Unassigned') AS "teamName",
        COUNT(project.id) AS "projectCount"
      FROM projects project
      LEFT JOIN teams team ON team.id = project.team_id
      GROUP BY team.id, team.name
      ORDER BY "projectCount" DESC, "teamName" ASC
      LIMIT 10
    `),
    manager.query(`
      SELECT tech.value AS tech, COUNT(*) AS count
      FROM projects project
      CROSS JOIN LATERAL jsonb_array_elements_text(project.tech_stack) AS tech(value)
      GROUP BY tech.value
      ORDER BY count DESC, tech.value ASC
      LIMIT 10
    `),
    manager.query(`
      SELECT
        project.id AS "projectId",
        project.name AS "projectName",
        COUNT(task.id) AS "openTasks"
      FROM projects project
      LEFT JOIN tasks task ON task.project_id = project.id AND task.status <> 'done'
      GROUP BY project.id, project.name
      HAVING COUNT(task.id) > 0
      ORDER BY "openTasks" DESC, project.name ASC
      LIMIT 8
    `),
    manager.query(`
      SELECT
        project.id AS "projectId",
        project.name AS "projectName",
        COUNT(task.id) AS "totalTasks",
        COUNT(task.id) FILTER (WHERE task.status = 'done') AS "doneTasks"
      FROM projects project
      LEFT JOIN tasks task ON task.project_id = project.id
      GROUP BY project.id, project.name
      HAVING COUNT(task.id) > 0
      ORDER BY project.name ASC
      LIMIT 12
    `),
  ])

  return {
    projectStatus: countBy(projectStatusRows, 'status'),
    projectsByTeam: projectsByTeam.map(
      (row: { teamId: string; teamName: string; projectCount: string | number }) => ({
        teamId: row.teamId,
        teamName: row.teamName,
        projectCount: toNumber(row.projectCount),
      })
    ),
    techStackUsage: techStackUsage.map((row: { tech: string; count: string | number }) => ({
      tech: row.tech,
      count: toNumber(row.count),
    })),
    topProjectsByOpenTasks: topProjectsByOpenTasks.map(
      (row: { projectId: string; projectName: string; openTasks: string | number }) => ({
        projectId: row.projectId,
        projectName: row.projectName,
        openTasks: toNumber(row.openTasks),
      })
    ),
    projectCompletion: projectCompletion.map(
      (row: {
        projectId: string
        projectName: string
        totalTasks: string | number
        doneTasks: string | number
      }) => {
        const totalTasks = toNumber(row.totalTasks)
        const doneTasks = toNumber(row.doneTasks)
        return {
          projectId: row.projectId,
          projectName: row.projectName,
          totalTasks,
          doneTasks,
          completion: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        }
      }
    ),
  }
}

export const getProjectInsights = async (projectId: string) => {
  const manager = AppDataSource.manager
  const [taskStatusRows, taskPriorityRows, assigneeWorkload, totals] = await Promise.all([
    manager.query(
      `
      SELECT status, COUNT(*) AS count
      FROM tasks
      WHERE project_id = $1
      GROUP BY status
      ORDER BY status
    `,
      [projectId]
    ),
    manager.query(
      `
      SELECT priority, COUNT(*) AS count
      FROM tasks
      WHERE project_id = $1
      GROUP BY priority
      ORDER BY priority
    `,
      [projectId]
    ),
    manager.query(
      `
      SELECT
        users.id AS "userId",
        users.name AS "userName",
        COUNT(task.id) AS "openTasks"
      FROM tasks task
      INNER JOIN users ON users.id = task.assigned_to
      WHERE task.project_id = $1 AND task.status <> 'done'
      GROUP BY users.id, users.name
      ORDER BY "openTasks" DESC, users.name ASC
      LIMIT 10
    `,
      [projectId]
    ),
    manager.query(
      `
      SELECT
        COUNT(*) AS "totalTasks",
        COUNT(*) FILTER (WHERE status = 'done') AS "doneTasks",
        COUNT(*) FILTER (WHERE status <> 'done') AS "openTasks"
      FROM tasks
      WHERE project_id = $1
    `,
      [projectId]
    ),
  ])
  const totalTasks = toNumber(totals[0]?.totalTasks)
  const doneTasks = toNumber(totals[0]?.doneTasks)

  return {
    taskStatus: countBy(taskStatusRows, 'status'),
    taskPriority: countBy(taskPriorityRows, 'priority'),
    assigneeWorkload: assigneeWorkload.map(
      (row: { userId: string; userName: string; openTasks: string | number }) => ({
        userId: row.userId,
        userName: row.userName,
        openTasks: toNumber(row.openTasks),
      })
    ),
    completion: {
      totalTasks,
      doneTasks,
      openTasks: toNumber(totals[0]?.openTasks),
      percent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
  }
}

export const getMyTaskInsights = async (userId: string) => {
  const manager = AppDataSource.manager
  const [taskStatusRows, taskPriorityRows, dueSoon, projectLoad] = await Promise.all([
    manager.query(
      `
      SELECT status, COUNT(*) AS count
      FROM tasks
      WHERE assigned_to = $1
      GROUP BY status
      ORDER BY status
    `,
      [userId]
    ),
    manager.query(
      `
      SELECT priority, COUNT(*) AS count
      FROM tasks
      WHERE assigned_to = $1
      GROUP BY priority
      ORDER BY priority
    `,
      [userId]
    ),
    manager.query(
      `
      SELECT due_date AS date, COUNT(*) AS count
      FROM tasks
      WHERE assigned_to = $1
        AND due_date IS NOT NULL
        AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
        AND status <> 'done'
      GROUP BY due_date
      ORDER BY due_date ASC
    `,
      [userId]
    ),
    manager.query(
      `
      SELECT
        COALESCE(project.id::text, 'personal') AS "projectId",
        COALESCE(project.name, 'Personal') AS "projectName",
        COUNT(task.id) AS "openTasks"
      FROM tasks task
      LEFT JOIN projects project ON project.id = task.project_id
      WHERE task.assigned_to = $1 AND task.status <> 'done'
      GROUP BY project.id, project.name
      ORDER BY "openTasks" DESC, "projectName" ASC
      LIMIT 10
    `,
      [userId]
    ),
  ])

  return {
    taskStatus: countBy(taskStatusRows, 'status'),
    taskPriority: countBy(taskPriorityRows, 'priority'),
    dueSoon: dueSoon.map((row: { date: string; count: string | number }) => ({
      date: row.date,
      count: toNumber(row.count),
    })),
    projectLoad: projectLoad.map(
      (row: { projectId: string; projectName: string; openTasks: string | number }) => ({
        projectId: row.projectId,
        projectName: row.projectName,
        openTasks: toNumber(row.openTasks),
      })
    ),
  }
}
