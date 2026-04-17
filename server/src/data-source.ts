import 'reflect-metadata'
import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import { Note } from './entities/Note'
import { Project } from './entities/Project'
import { ProjectMember } from './entities/ProjectMember'
import { Team } from './entities/Team'
import { Task } from './entities/Task'
import { User } from './entities/User'

dotenv.config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'orgsphere_db',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Team, Project, ProjectMember, Task, Note],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
})
