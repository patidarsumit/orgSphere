export interface InsightDatum {
  key: string
  label: string
  value: number
}

export interface TeamWorkloadInsight {
  teamId: string
  teamName: string
  openTasks: number
}

export interface ActivityTrendInsight {
  date: string
  count: number
}

export interface DashboardInsights {
  projectStatus: InsightDatum[]
  taskStatus: InsightDatum[]
  taskPriority: InsightDatum[]
  teamWorkload: TeamWorkloadInsight[]
  activityTrend: ActivityTrendInsight[]
}

export interface ProjectsByTeamInsight {
  teamId: string
  teamName: string
  projectCount: number
}

export interface TechStackUsageInsight {
  tech: string
  count: number
}

export interface ProjectOpenTasksInsight {
  projectId: string
  projectName: string
  openTasks: number
}

export interface ProjectCompletionInsight {
  projectId: string
  projectName: string
  totalTasks: number
  doneTasks: number
  completion: number
}

export interface ProjectsInsights {
  projectStatus: InsightDatum[]
  projectsByTeam: ProjectsByTeamInsight[]
  techStackUsage: TechStackUsageInsight[]
  topProjectsByOpenTasks: ProjectOpenTasksInsight[]
  projectCompletion: ProjectCompletionInsight[]
}

export interface AssigneeWorkloadInsight {
  userId: string
  userName: string
  openTasks: number
}

export interface ProjectDetailInsights {
  taskStatus: InsightDatum[]
  taskPriority: InsightDatum[]
  assigneeWorkload: AssigneeWorkloadInsight[]
  completion: {
    totalTasks: number
    doneTasks: number
    openTasks: number
    percent: number
  }
}

export interface MyTaskInsights {
  taskStatus: InsightDatum[]
  taskPriority: InsightDatum[]
  dueSoon: ActivityTrendInsight[]
  projectLoad: ProjectOpenTasksInsight[]
}

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

export interface ProjectsHealth {
  summary: {
    healthy: number
    attention: number
    atRisk: number
    total: number
  }
  projects: ProjectHealthSignal[]
}
