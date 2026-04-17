import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Note } from '../entities/Note'
import { Project } from '../entities/Project'
import { Task } from '../entities/Task'
import { User } from '../entities/User'

async function seed() {
  await AppDataSource.initialize()

  const userRepo = AppDataSource.getRepository(User)
  const projectRepo = AppDataSource.getRepository(Project)
  const taskRepo = AppDataSource.getRepository(Task)
  const noteRepo = AppDataSource.getRepository(Note)

  const sumit = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const alpha = await projectRepo.findOne({ where: { name: 'Alpha Platform' } })
  const beta = await projectRepo.findOne({ where: { name: 'Beta Analytics Dashboard' } })

  if (!sumit) {
    console.log('Sumit not found. Run employee seeds first.')
    await AppDataSource.destroy()
    return
  }

  await taskRepo.delete({ assigned_to: sumit.id })
  await noteRepo.delete({ user_id: sumit.id })

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  const tasksData = [
    {
      title: 'Review architectural specifications',
      status: 'todo' as const,
      priority: 'high' as const,
      due_date: today,
      project_id: alpha?.id,
    },
    {
      title: 'Draft Q4 resource allocation',
      status: 'todo' as const,
      priority: 'medium' as const,
      due_date: today,
      project_id: null,
    },
    {
      title: 'Stand-up meeting with design team',
      status: 'done' as const,
      priority: 'medium' as const,
      due_date: yesterday,
      project_id: null,
    },
    {
      title: 'Update security protocols on AWS',
      status: 'in_progress' as const,
      priority: 'high' as const,
      due_date: tomorrow,
      project_id: alpha?.id,
    },
    {
      title: 'Finalize API documentation',
      status: 'review' as const,
      priority: 'medium' as const,
      due_date: tomorrow,
      project_id: alpha?.id,
    },
    {
      title: 'Setup analytics pipeline',
      status: 'in_progress' as const,
      priority: 'high' as const,
      due_date: today,
      project_id: beta?.id,
    },
    {
      title: 'Write unit tests for auth module',
      status: 'todo' as const,
      priority: 'low' as const,
      due_date: null,
      project_id: alpha?.id,
    },
    {
      title: 'Create onboarding documentation',
      status: 'todo' as const,
      priority: 'medium' as const,
      due_date: null,
      project_id: null,
    },
  ]

  for (const taskData of tasksData) {
    const task = taskRepo.create({
      ...taskData,
      assigned_to: sumit.id,
      created_by: sumit.id,
    })
    await taskRepo.save(task)
  }
  console.log(`Created ${tasksData.length} tasks for Sumit`)

  const notesData = [
    {
      title: 'Q4 Product Roadmap',
      tags: ['Strategy', 'Urgent'],
      project_id: alpha?.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The primary goal for Q4 is to complete the platform migration and launch the analytics dashboard. Key milestones include API v2 release, mobile app beta, and design system rollout.',
              },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Key Strategic Pillars' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Complete microservices migration' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Launch analytics dashboard v1' }],
                  },
                ],
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Onboard 3 new enterprise clients' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Weekly Sync Notes',
      tags: ['Team'],
      project_id: null,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Action items from engineering team regarding new dashboard latency issues. Need to investigate PostgreSQL query performance and consider adding Redis caching layer.',
              },
            ],
          },
        ],
      },
    },
    {
      title: 'Architecture Decision: Microservices',
      tags: ['Technical', 'Draft'],
      project_id: alpha?.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Documenting the decision to migrate from monolith to microservices. Main drivers: team scalability, independent deployments, and technology flexibility.',
              },
            ],
          },
        ],
      },
    },
  ]

  for (const noteData of notesData) {
    const note = noteRepo.create({ ...noteData, user_id: sumit.id })
    await noteRepo.save(note)
  }
  console.log(`Created ${notesData.length} notes for Sumit`)

  console.log('Tasks and notes seed complete')
  await AppDataSource.destroy()
}

seed().catch((error) => {
  console.error(error)
  void AppDataSource.destroy()
  process.exit(1)
})
