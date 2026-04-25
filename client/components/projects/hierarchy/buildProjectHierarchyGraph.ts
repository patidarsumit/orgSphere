import { GraphEdge, GraphModel, GraphNode } from '@/components/graph/types'
import { Project, ProjectMember, Task, TaskStatus } from '@/types'

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

const taskStatusTones: Record<TaskStatus, GraphNode['tone']> = {
  todo: 'slate',
  in_progress: 'blue',
  review: 'amber',
  done: 'green',
}

const MAX_VISIBLE_MEMBERS = 10

function pushEdge(edges: GraphEdge[], source: string, target: string, label?: string) {
  edges.push({
    id: `${source}-${target}`,
    source,
    target,
    label,
  })
}

function roleSubtitle(member: ProjectMember) {
  const department = member.user.department || 'General'
  return `${member.role} - ${department}`
}

export function buildProjectHierarchyGraph(project: Project, tasks: Task[]): GraphModel {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const completedTasks = tasks.filter((task) => task.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  nodes.push({
    id: `project-${project.id}`,
    kind: 'project',
    title: project.name,
    subtitle: project.description || 'Project workspace',
    details: project.description || undefined,
    eyebrow: 'Project',
    badge: project.status.replace('_', ' '),
    tone: 'primary',
    level: 0,
    order: 0,
    stats: [
      { label: 'Members', value: project.project_members.length },
      { label: 'Tasks', value: tasks.length },
    ],
    collapsible: true,
  })

  if (project.manager) {
    const id = `manager-${project.manager.id}`
    nodes.push({
      id,
      kind: 'person',
      title: project.manager.name,
      subtitle: project.manager.department || 'General',
      eyebrow: 'Project Manager',
      href: `/employees/${project.manager.id}`,
      tone: 'blue',
      level: 1,
      order: 0,
      badge: 'Owns delivery',
    })
    pushEdge(edges, `project-${project.id}`, id)
  }

  if (project.tech_lead) {
    const id = `tech-lead-${project.tech_lead.id}`
    nodes.push({
      id,
      kind: 'person',
      title: project.tech_lead.name,
      subtitle: project.tech_lead.department || 'Engineering',
      eyebrow: 'Tech Lead',
      href: `/employees/${project.tech_lead.id}`,
      tone: 'purple',
      level: 1,
      order: 1,
      badge: 'Technical owner',
    })
    pushEdge(edges, `project-${project.id}`, id)
  }

  if (project.team) {
    const id = `team-${project.team.id}`
    nodes.push({
      id,
      kind: 'team',
      title: project.team.name,
      subtitle: project.team.description || 'Assigned owner team',
      details: project.team.description || undefined,
      eyebrow: 'Team',
      href: `/teams/${project.team.id}`,
      tone: 'green',
      level: 1,
      order: 2,
      stats: [{ label: 'Members', value: project.project_members.length }],
      collapsible: true,
    })
    pushEdge(edges, `project-${project.id}`, id)
  }

  const taskSummaryId = `tasks-${project.id}`
  nodes.push({
    id: taskSummaryId,
    kind: 'metric',
    title: 'Delivery Progress',
    subtitle: tasks.length > 0 ? `${completedTasks} of ${tasks.length} tasks complete` : 'No tasks linked yet',
    eyebrow: 'Execution',
    tone: progress >= 75 ? 'green' : progress >= 35 ? 'amber' : 'slate',
    level: 1,
    order: 3,
    stats: [
      { label: 'Progress', value: `${progress}%` },
      { label: 'Open', value: Math.max(tasks.length - completedTasks, 0) },
    ],
    collapsible: true,
  })
  pushEdge(edges, `project-${project.id}`, taskSummaryId)

  const visibleMembers = project.project_members.slice(0, MAX_VISIBLE_MEMBERS)
  visibleMembers.forEach((member, index) => {
    const id = `member-${member.user_id}`
    nodes.push({
      id,
      kind: 'person',
      title: member.user.name,
      subtitle: roleSubtitle(member),
      eyebrow: 'Member',
      href: `/employees/${member.user.id}`,
      tone: 'slate',
      level: 2,
      order: index,
    })
    pushEdge(edges, project.team ? `team-${project.team.id}` : `project-${project.id}`, id)
  })

  const overflowCount = project.project_members.length - visibleMembers.length
  if (overflowCount > 0) {
    const id = `members-overflow-${project.id}`
    nodes.push({
      id,
      kind: 'group',
      title: `${overflowCount} more members`,
      subtitle: 'Open the Team tab to see the full roster',
      eyebrow: 'Roster',
      tone: 'slate',
      level: 2,
      order: visibleMembers.length,
    })
    pushEdge(edges, project.team ? `team-${project.team.id}` : `project-${project.id}`, id)
  }

  const statusCounts = tasks.reduce<Record<TaskStatus, number>>(
    (counts, task) => ({
      ...counts,
      [task.status]: counts[task.status] + 1,
    }),
    { todo: 0, in_progress: 0, review: 0, done: 0 }
  )

  ;(Object.keys(taskStatusLabels) as TaskStatus[]).forEach((status, index) => {
    const id = `task-status-${status}`
    nodes.push({
      id,
      kind: 'status',
      title: taskStatusLabels[status],
      subtitle: `${statusCounts[status]} task${statusCounts[status] === 1 ? '' : 's'}`,
      eyebrow: 'Task Status',
      tone: taskStatusTones[status],
      level: 2,
      order: visibleMembers.length + 1 + index,
    })
    pushEdge(edges, taskSummaryId, id)
  })

  return { nodes, edges }
}
