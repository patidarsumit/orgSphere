import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { ActivityAction, ActivityEntityType, ActivityLog } from '../entities/ActivityLog'
import { Project } from '../entities/Project'
import { Team } from '../entities/Team'
import { User } from '../entities/User'

interface SeedActivity {
  action: ActivityAction
  entity_type: ActivityEntityType
  entity_id: string
  entity_name: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
  created_at: Date
}

async function seed() {
  await AppDataSource.initialize()

  const logRepo = AppDataSource.getRepository(ActivityLog)
  const userRepo = AppDataSource.getRepository(User)
  const projectRepo = AppDataSource.getRepository(Project)
  const teamRepo = AppDataSource.getRepository(Team)

  const [sumit, raj, priya, ananya, alpha, beta, platform] = await Promise.all([
    userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } }),
    userRepo.findOne({ where: { email: 'raj@orgsphere.io' } }),
    userRepo.findOne({ where: { email: 'priya@orgsphere.io' } }),
    userRepo.findOne({ where: { email: 'ananya@orgsphere.io' } }),
    projectRepo.findOne({ where: { name: 'Alpha Platform' } }),
    projectRepo.findOne({ where: { name: 'Beta Analytics Dashboard' } }),
    teamRepo.findOne({ where: { name: 'Platform Team' } }),
  ])

  if (!sumit || !alpha) {
    console.log('Required seed data missing. Run employee + project seeds first.')
    await AppDataSource.destroy()
    return
  }

  await logRepo.clear()

  const now = Date.now()
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000

  const entries: SeedActivity[] = [
    {
      action: 'updated',
      entity_type: 'project',
      entity_id: alpha.id,
      entity_name: alpha.name,
      actor_id: raj?.id ?? sumit.id,
      metadata: {},
      created_at: new Date(now - 14 * minute),
    },
    {
      action: 'status_changed',
      entity_type: 'project',
      entity_id: beta?.id ?? alpha.id,
      entity_name: beta?.name ?? alpha.name,
      actor_id: priya?.id ?? sumit.id,
      metadata: { old_status: 'planned', new_status: 'active' },
      created_at: new Date(now - hour),
    },
    {
      action: 'member_added',
      entity_type: 'team_member',
      entity_id: platform?.id ?? alpha.id,
      entity_name: platform?.name ?? 'Platform Team',
      actor_id: sumit.id,
      metadata: { member_name: ananya?.name ?? 'Ananya Sharma', member_id: ananya?.id },
      created_at: new Date(now - 3 * hour),
    },
    {
      action: 'completed',
      entity_type: 'task',
      entity_id: sumit.id,
      entity_name: 'Stand-up meeting with design team',
      actor_id: sumit.id,
      metadata: {},
      created_at: new Date(now - 5 * hour),
    },
    {
      action: 'created',
      entity_type: 'note',
      entity_id: sumit.id,
      entity_name: 'Q4 Product Roadmap',
      actor_id: sumit.id,
      metadata: {},
      created_at: new Date(now - day),
    },
    {
      action: 'created',
      entity_type: 'employee',
      entity_id: ananya?.id ?? sumit.id,
      entity_name: ananya?.name ?? 'New Employee',
      actor_id: sumit.id,
      metadata: {},
      created_at: new Date(now - 2 * day),
    },
    {
      action: 'updated',
      entity_type: 'project',
      entity_id: alpha.id,
      entity_name: alpha.name,
      actor_id: raj?.id ?? sumit.id,
      metadata: { field: 'tech_stack' },
      created_at: new Date(now - 2 * day),
    },
    {
      action: 'created',
      entity_type: 'project',
      entity_id: beta?.id ?? alpha.id,
      entity_name: beta?.name ?? 'New Project',
      actor_id: priya?.id ?? sumit.id,
      metadata: {},
      created_at: new Date(now - 3 * day),
    },
  ]

  for (const entry of entries) {
    await logRepo.save(logRepo.create({ ...entry, read_by: [] }))
  }

  console.log(`Created ${entries.length} activity log entries`)
  console.log('Activity seed complete')
  await AppDataSource.destroy()
}

seed().catch((error) => {
  console.error(error)
  void AppDataSource.destroy()
  process.exit(1)
})
