import 'reflect-metadata'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { AppDataSource } from '../data-source'
import { User, UserRole } from '../entities/User'

dotenv.config()

type SeedEmployee = {
  name: string
  email: string
  role: UserRole
  department: string
  skills: string[]
}

const employees: SeedEmployee[] = [
  {
    name: 'Sumit Sharma',
    email: 'sumit@orgsphere.io',
    role: 'admin',
    department: 'Engineering',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  },
  {
    name: 'Priya Patel',
    email: 'priya@orgsphere.io',
    role: 'manager',
    department: 'Product',
    skills: ['Product Strategy', 'Agile', 'Roadmapping'],
  },
  {
    name: 'Riya Menon',
    email: 'riya@orgsphere.io',
    role: 'hr',
    department: 'People Operations',
    skills: ['Onboarding', 'HRIS', 'Policy Management'],
  },
  {
    name: 'Raj Mehta',
    email: 'raj@orgsphere.io',
    role: 'tech_lead',
    department: 'Engineering',
    skills: ['Go', 'Kubernetes', 'AWS', 'System Design'],
  },
  {
    name: 'Ananya Singh',
    email: 'ananya@orgsphere.io',
    role: 'employee',
    department: 'Design',
    skills: ['Figma', 'UI Design', 'User Research', 'Prototyping'],
  },
  {
    name: 'Arjun Kapoor',
    email: 'arjun@orgsphere.io',
    role: 'viewer',
    department: 'Leadership',
    skills: ['Reporting', 'Stakeholder Reviews'],
  },
  {
    name: 'Vikram Nair',
    email: 'vikram@orgsphere.io',
    role: 'employee',
    department: 'Engineering',
    skills: ['Python', 'FastAPI', 'Machine Learning'],
  },
  {
    name: 'Neha Joshi',
    email: 'neha@orgsphere.io',
    role: 'employee',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'GraphQL'],
  },
  {
    name: 'Amit Kumar',
    email: 'amit@orgsphere.io',
    role: 'manager',
    department: 'Engineering',
    skills: ['Team Leadership', 'Java', 'Spring Boot'],
  },
  {
    name: 'Deepa Iyer',
    email: 'deepa@orgsphere.io',
    role: 'employee',
    department: 'Marketing',
    skills: ['SEO', 'Content Strategy', 'Analytics'],
  },
  {
    name: 'Rahul Gupta',
    email: 'rahul@orgsphere.io',
    role: 'tech_lead',
    department: 'Infrastructure',
    skills: ['DevOps', 'Terraform', 'Docker', 'Linux'],
  },
  {
    name: 'Kavita Sharma',
    email: 'kavita@orgsphere.io',
    role: 'employee',
    department: 'Design',
    skills: ['Illustration', 'Motion', 'Adobe Creative Suite'],
  },
]

const setManager = async (
  repo: Repository<User>,
  employeeEmail: string,
  managerEmail: string
) => {
  const employee = await repo.findOne({ where: { email: employeeEmail } })
  const manager = await repo.findOne({ where: { email: managerEmail } })

  if (employee && manager && employee.manager_id !== manager.id) {
    employee.manager_id = manager.id
    await repo.save(employee)
  }
}

async function seed() {
  await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(User)
  const password_hash = await bcrypt.hash('Password123!', 12)

  for (const employee of employees) {
    const exists = await repo.findOne({ where: { email: employee.email } })

    if (exists) {
      console.log(`Skipped existing employee: ${employee.name}`)
      continue
    }

    const user = repo.create({ ...employee, password_hash })
    await repo.save(user)
    console.log(`Created employee: ${employee.name}`)
  }

  await setManager(repo, 'raj@orgsphere.io', 'sumit@orgsphere.io')
  await setManager(repo, 'priya@orgsphere.io', 'sumit@orgsphere.io')
  await setManager(repo, 'amit@orgsphere.io', 'sumit@orgsphere.io')
  await setManager(repo, 'riya@orgsphere.io', 'sumit@orgsphere.io')

  for (const email of ['ananya@orgsphere.io', 'vikram@orgsphere.io', 'neha@orgsphere.io']) {
    await setManager(repo, email, 'raj@orgsphere.io')
  }

  console.log('Seed complete')
  await AppDataSource.destroy()
}

seed().catch(async (error: unknown) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
