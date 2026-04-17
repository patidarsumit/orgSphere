import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Project, ProjectStatus } from '../entities/Project'
import { ProjectMember } from '../entities/ProjectMember'
import { Team } from '../entities/Team'
import { User } from '../entities/User'

interface SeedProjectMember {
  email: string
  role: string
}

interface SeedProject {
  name: string
  description: string
  status: ProjectStatus
  tech_stack: string[]
  start_date: string
  managerEmail: string
  leadEmail: string
  teamName: string
  members: SeedProjectMember[]
}

const projects: SeedProject[] = [
  {
    name: 'Alpha Platform',
    description:
      'Core infrastructure platform rebuild. Migrating monolith to modular services with improved scalability and observability.',
    status: 'active',
    tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'TypeScript'],
    start_date: '2024-01-15',
    managerEmail: 'sumit@orgsphere.io',
    leadEmail: 'raj@orgsphere.io',
    teamName: 'Platform Team',
    members: [
      { email: 'sumit@orgsphere.io', role: 'Project Manager' },
      { email: 'raj@orgsphere.io', role: 'Tech Lead' },
      { email: 'vikram@orgsphere.io', role: 'Backend Developer' },
      { email: 'neha@orgsphere.io', role: 'Frontend Developer' },
      { email: 'rahul@orgsphere.io', role: 'DevOps Engineer' },
    ],
  },
  {
    name: 'Beta Analytics Dashboard',
    description:
      'Real-time analytics and reporting dashboard for business intelligence with custom charts and automated reports.',
    status: 'on_hold',
    tech_stack: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Redis'],
    start_date: '2024-02-01',
    managerEmail: 'priya@orgsphere.io',
    leadEmail: 'raj@orgsphere.io',
    teamName: 'Platform Team',
    members: [
      { email: 'priya@orgsphere.io', role: 'Product Manager' },
      { email: 'raj@orgsphere.io', role: 'Tech Lead' },
      { email: 'vikram@orgsphere.io', role: 'Data Engineer' },
      { email: 'ananya@orgsphere.io', role: 'UI Designer' },
    ],
  },
  {
    name: 'OrgSphere Mobile App',
    description:
      'Native mobile application for iOS and Android with access to org visibility, tasks, and team communication.',
    status: 'planned',
    tech_stack: ['React Native', 'Expo', 'TypeScript', 'Node.js'],
    start_date: '2024-04-01',
    managerEmail: 'amit@orgsphere.io',
    leadEmail: 'neha@orgsphere.io',
    teamName: 'Mobile Team',
    members: [
      { email: 'amit@orgsphere.io', role: 'Project Manager' },
      { email: 'neha@orgsphere.io', role: 'Lead Developer' },
      { email: 'vikram@orgsphere.io', role: 'Backend Developer' },
      { email: 'ananya@orgsphere.io', role: 'UI Designer' },
    ],
  },
  {
    name: 'Design System v2',
    description:
      'Comprehensive component library and design system standardizing UI across OrgSphere products with accessibility built in.',
    status: 'active',
    tech_stack: ['React', 'TypeScript', 'Storybook', 'Figma'],
    start_date: '2024-01-20',
    managerEmail: 'priya@orgsphere.io',
    leadEmail: 'ananya@orgsphere.io',
    teamName: 'Product Team',
    members: [
      { email: 'priya@orgsphere.io', role: 'Product Manager' },
      { email: 'ananya@orgsphere.io', role: 'Lead Designer' },
      { email: 'neha@orgsphere.io', role: 'Frontend Developer' },
    ],
  },
]

async function seed() {
  await AppDataSource.initialize()

  const userRepo = AppDataSource.getRepository(User)
  const teamRepo = AppDataSource.getRepository(Team)
  const projectRepo = AppDataSource.getRepository(Project)
  const projectMemberRepo = AppDataSource.getRepository(ProjectMember)

  const users = await userRepo.find()
  const teams = await teamRepo.find()
  const userByEmail = new Map(users.map((user) => [user.email, user]))
  const teamByName = new Map(teams.map((team) => [team.name, team]))

  for (const seedProject of projects) {
    const manager = userByEmail.get(seedProject.managerEmail)
    const lead = userByEmail.get(seedProject.leadEmail)
    const team = teamByName.get(seedProject.teamName)

    const project =
      (await projectRepo.findOne({ where: { name: seedProject.name } })) ||
      projectRepo.create({ name: seedProject.name })

    project.description = seedProject.description
    project.status = seedProject.status
    project.tech_stack = seedProject.tech_stack
    project.start_date = seedProject.start_date
    project.manager_id = manager?.id || null
    project.tech_lead_id = lead?.id || null
    project.team_id = team?.id || null

    const savedProject = await projectRepo.save(project)
    await projectMemberRepo.delete({ project_id: savedProject.id })

    for (const member of seedProject.members) {
      const user = userByEmail.get(member.email)
      if (!user) {
        continue
      }

      await projectMemberRepo.save(
        projectMemberRepo.create({
          project_id: savedProject.id,
          user_id: user.id,
          role: member.role,
        })
      )
    }

    console.log(`Seeded project: ${seedProject.name} with ${seedProject.members.length} members`)
  }

  console.log('Projects seed complete')
  await AppDataSource.destroy()
}

seed().catch(async (error) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
