import 'reflect-metadata'
import dotenv from 'dotenv'
import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'
import { User } from '../entities/User'
import { calculateReadingTime, generateUniqueSlug } from '../utils/slug'

dotenv.config()

const postsData = [
  {
    title: "Why Org Visibility is the Competitive Advantage You're Ignoring",
    subtitle: 'Most companies obsess over strategy. The best ones obsess over clarity.',
    tags: ['Leadership', 'Culture', 'Productivity'],
    views: 1240,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'In the modern enterprise, the biggest bottleneck is rarely talent, technology, or capital. It is clarity: who is working on what, why it matters, and how it connects to everything else.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The invisible tax of opacity' }] },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Every hour a senior engineer spends hunting for context is an hour not spent building. Every meeting that exists solely to synchronize information is a meeting that did not need to happen.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What radical transparency actually looks like' }] },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New engineers onboard faster when org structure is visible.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cross-team collaboration improves when expertise is discoverable.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Duplicate work decreases when project visibility is centralized.' }] }] },
          ],
        },
      ],
    },
  },
  {
    title: 'Building High-Trust Engineering Teams: A Practical Guide',
    subtitle: 'Trust is not a soft skill. It is an engineering practice.',
    tags: ['Engineering', 'Teams', 'Leadership'],
    views: 892,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'High-trust engineering teams ship faster, have lower attrition, and produce better software. The challenge is building trust systematically and repeatably.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Trust is built in small moments' }] },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'It is built in the code review that encourages instead of dismisses, the question that is answered without judgment, and the credit that is given publicly.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The three pillars of engineering trust' }] },
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Predictability: people do what they say they will do.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Competence: teammates trust each other technical judgment.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Benevolence: people believe others have their best interests in mind.' }] }] },
          ],
        },
      ],
    },
  },
  {
    title: 'The Hidden Cost of Poor Project Visibility',
    subtitle: 'You cannot optimize what you cannot see.',
    tags: ['Projects', 'Productivity', 'Culture'],
    views: 567,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Ask any engineering manager to list their biggest challenges and you will hear: I do not always know what my team is actually working on. This is not a people problem. It is a systems problem.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The four failure modes of project opacity' }] },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Duplicate work, misaligned priorities, missed dependencies, and delayed escalations are all symptoms of poor visibility.',
            },
          ],
        },
      ],
    },
  },
  {
    title: 'How We Built OrgSphere: Technical Decisions That Mattered',
    subtitle: 'A behind-the-scenes look at the architecture choices that shaped our product.',
    tags: ['Engineering', 'Product', 'Technical'],
    views: 2103,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Building an internal collaboration platform means making hundreds of small decisions that compound over time. Here are the ones that mattered most.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The monorepo decision' }] },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'We chose a monorepo from day one because shared Zod schemas keep frontend form validation and backend API validation aligned.',
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'State management philosophy' }] },
        {
          type: 'codeBlock',
          attrs: { language: 'typescript' },
          content: [
            {
              type: 'text',
              text: "// Redux: UI state only\n// TanStack Query: all server data\nuseQuery({ queryKey: ['projects'], queryFn })",
            },
          ],
        },
      ],
    },
  },
]

async function seed() {
  await AppDataSource.initialize()
  const postRepo = AppDataSource.getRepository(Post)
  const userRepo = AppDataSource.getRepository(User)

  const sumit = await userRepo.findOne({ where: { email: 'sumit@orgsphere.io' } })
  const priya = await userRepo.findOne({ where: { email: 'priya@orgsphere.io' } })
  const authors = [sumit, priya, sumit, priya]

  for (let index = 0; index < postsData.length; index += 1) {
    const data = postsData[index]
    const exists = await postRepo.findOne({ where: { title: data.title } })
    if (exists) {
      console.log(`Skipped existing post: ${data.title}`)
      continue
    }

    const post = postRepo.create({
      ...data,
      status: 'published',
      author_id: authors[index]?.id ?? null,
      slug: await generateUniqueSlug(data.title),
      reading_time: calculateReadingTime(data.content),
      published_at: new Date(Date.now() - (index + 1) * 3 * 24 * 60 * 60 * 1000),
    })
    await postRepo.save(post)
    console.log(`Created post: ${data.title}`)
  }

  console.log('Blog posts seed complete')
  await AppDataSource.destroy()
}

seed().catch(async (error: unknown) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
