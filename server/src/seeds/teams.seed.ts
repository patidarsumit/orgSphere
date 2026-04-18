import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Team } from '../entities/Team'
import { User } from '../entities/User'

const employeeEmails = [
  'sumit@orgsphere.io',
  'raj@orgsphere.io',
  'priya@orgsphere.io',
  'ananya@orgsphere.io',
  'vikram@orgsphere.io',
  'neha@orgsphere.io',
  'amit@orgsphere.io',
  'rahul@orgsphere.io',
  'deepa@orgsphere.io',
  'kavita@orgsphere.io',
] as const

type SeedEmail = (typeof employeeEmails)[number]

interface SeedTeam {
  name: string
  description: string
  creator: SeedEmail
  members: SeedEmail[]
}

const teams: SeedTeam[] = [
  {
    name: 'Platform Team',
    description: 'Core infrastructure and backend platform development',
    creator: 'sumit@orgsphere.io',
    members: [
      'sumit@orgsphere.io',
      'raj@orgsphere.io',
      'vikram@orgsphere.io',
      'neha@orgsphere.io',
      'rahul@orgsphere.io',
    ],
  },
  {
    name: 'Product Team',
    description: 'Product strategy, design, and user experience',
    creator: 'priya@orgsphere.io',
    members: ['priya@orgsphere.io', 'ananya@orgsphere.io', 'kavita@orgsphere.io'],
  },
  {
    name: 'Mobile Team',
    description: 'iOS and Android mobile application development',
    creator: 'amit@orgsphere.io',
    members: ['amit@orgsphere.io', 'neha@orgsphere.io', 'vikram@orgsphere.io'],
  },
  {
    name: 'Growth Team',
    description: 'Marketing, analytics, and business growth initiatives',
    creator: 'priya@orgsphere.io',
    members: ['priya@orgsphere.io', 'deepa@orgsphere.io'],
  },
]

const getUsersByEmail = async () => {
  const users = await AppDataSource.getRepository(User)
    .createQueryBuilder('user')
    .where('user.email IN (:...emails)', { emails: employeeEmails })
    .getMany()

  return new Map(users.map((user) => [user.email, user]))
}

async function seed() {
  await AppDataSource.initialize()

  const teamRepo = AppDataSource.getRepository(Team)
  const usersByEmail = await getUsersByEmail()

  for (const seedTeam of teams) {
    const creator = usersByEmail.get(seedTeam.creator)
    const members = seedTeam.members
      .map((email) => usersByEmail.get(email))
      .filter((user): user is User => Boolean(user))

    const existing = await teamRepo.findOne({
      where: { name: seedTeam.name },
      relations: ['members'],
    })

    if (existing) {
      existing.description = seedTeam.description
      existing.created_by = creator?.id || null
      existing.members = members
      await teamRepo.save(existing)
      console.log(`Updated team: ${seedTeam.name} with ${members.length} members`)
      continue
    }

    const team = teamRepo.create({
      name: seedTeam.name,
      description: seedTeam.description,
      created_by: creator?.id || null,
      members,
    })
    await teamRepo.save(team)
    console.log(`Created team: ${seedTeam.name} with ${members.length} members`)
  }

  console.log('Teams seed complete')
  await AppDataSource.destroy()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
