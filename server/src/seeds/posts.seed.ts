import 'reflect-metadata'
import dotenv from 'dotenv'
import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'
import { User } from '../entities/User'
import { calculateReadingTime, generateUniqueSlug } from '../utils/slug'

dotenv.config()

type SeedPost = {
  title: string
  subtitle: string
  tags: string[]
  views: number
  authorEmail: string
  content: Record<string, unknown>
}

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})

const heading = (text: string, level = 2) => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})

const bulletList = (items: string[]) => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(item)],
  })),
})

const orderedList = (items: string[]) => ({
  type: 'orderedList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(item)],
  })),
})

const postsData: SeedPost[] = [
  {
    title: 'Why Operational Clarity Is the New SaaS Moat',
    subtitle: 'The teams that move fastest are the ones that can see their work clearly.',
    tags: ['Leadership', 'Operations', 'Strategy'],
    views: 1840,
    authorEmail: 'sumit@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Most organizations are not blocked by effort. They are blocked by fog. When teams cannot see ownership, progress, and risk in one place, execution slows down long before talent runs out.'),
        heading('Clarity compounds'),
        paragraph('A clear operating model reduces duplicate work, shortens meetings, and improves trust between teams. It turns decision making from a social exercise into a shared system.'),
        heading('What good visibility looks like'),
        bulletList([
          'Projects have visible owners, status, and milestones.',
          'People can find expertise without asking around.',
          'Risks surface early instead of waiting for a status meeting.',
        ]),
      ],
    },
  },
  {
    title: 'The Quiet Cost of Context Switching in Hybrid Teams',
    subtitle: 'Productivity drops long before anyone misses a deadline.',
    tags: ['Productivity', 'Teams', 'Remote Work'],
    views: 1365,
    authorEmail: 'priya@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Hybrid work gives teams flexibility, but it also multiplies the number of places where context lives. People lose momentum whenever they have to reconstruct what happened, why it happened, and what comes next.'),
        heading('What switching really costs'),
        paragraph('The visible cost is delay. The hidden cost is degraded judgment. When people are constantly reloading context, they stop making thoughtful decisions and start protecting their calendars.'),
        heading('Three fixes that work'),
        orderedList([
          'Centralize work updates where everyone can see them.',
          'Link people, projects, and tasks instead of treating them as separate systems.',
          'Prefer lightweight async updates over recurring status meetings.',
        ]),
      ],
    },
  },
  {
    title: 'How Strong Engineering Managers Spot Overload Early',
    subtitle: 'The best signals are usually visible before burnout becomes obvious.',
    tags: ['Engineering', 'Management', 'People'],
    views: 1192,
    authorEmail: 'raj@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Overload rarely appears all at once. It shows up in late feedback cycles, reduced code review quality, and teammates quietly picking up operational work that no one planned for.'),
        heading('What to monitor'),
        bulletList([
          'Too many active projects assigned to one person.',
          'Tasks staying in progress without meaningful movement.',
          'Notes and decisions living in private channels instead of shared systems.',
        ]),
        heading('The manager’s job'),
        paragraph('Good managers do not wait for a red flag in a one-on-one. They design systems that make load visible early enough to rebalance it.'),
      ],
    },
  },
  {
    title: 'Design Systems Fail When Teams Treat Them Like Asset Libraries',
    subtitle: 'A design system is an operating model, not just a component folder.',
    tags: ['Design', 'Systems', 'Frontend'],
    views: 978,
    authorEmail: 'ananya@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Many teams say they have a design system when what they really have is a shared folder of components. That helps consistency, but it does not solve the harder problem of decision quality.'),
        heading('A real design system should answer'),
        bulletList([
          'Which patterns are preferred and why?',
          'How do teams evolve primitives without fragmenting the product?',
          'What accessibility and content standards are non-negotiable?',
        ]),
        heading('Consistency without rigidity'),
        paragraph('The goal is not sameness. The goal is a coherent product that can still adapt to different workflows and levels of complexity.'),
      ],
    },
  },
  {
    title: 'Five Metrics That Actually Help Leaders Understand Delivery Risk',
    subtitle: 'Vanity dashboards create confidence. Operating metrics create action.',
    tags: ['Analytics', 'Projects', 'Leadership'],
    views: 1510,
    authorEmail: 'priya@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Many dashboards are great at reporting motion and weak at surfacing risk. Leaders need signals that help them intervene early, not retrospective summaries that merely explain what already happened.'),
        heading('The useful five'),
        orderedList([
          'Projects with unresolved blockers beyond agreed SLA.',
          'Employees carrying more active work than their role can absorb.',
          'Tasks with repeated due date movement.',
          'Teams with growing dependency chains.',
          'Projects missing an accountable owner.',
        ]),
        heading('What good metrics do'),
        paragraph('They reduce ambiguity, sharpen conversation, and give managers something specific to act on the same day.'),
      ],
    },
  },
  {
    title: 'Inside a Better Onboarding Experience for Modern Product Teams',
    subtitle: 'The first two weeks should reduce anxiety, not increase it.',
    tags: ['HR', 'Onboarding', 'Culture'],
    views: 889,
    authorEmail: 'riya@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('New hires do not just need tools and access. They need a map: who the key people are, what the important projects are, and how decisions move through the organization.'),
        heading('What new hires need immediately'),
        bulletList([
          'A visible org structure with reporting lines.',
          'A concise view of current initiatives and owners.',
          'A clear first-week checklist tied to real teammates and systems.',
        ]),
        heading('The payoff'),
        paragraph('When onboarding is designed around visibility, new hires contribute faster and ask better questions sooner.'),
      ],
    },
  },
  {
    title: 'Why Product Teams Need a Shared Decision Journal',
    subtitle: 'A missed decision is often more expensive than a delayed feature.',
    tags: ['Product', 'Documentation', 'Decision Making'],
    views: 1044,
    authorEmail: 'amit@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Teams remember decisions much less reliably than they think. Six weeks later, people remember the conclusion differently, the tradeoffs vaguely, and the owner not at all.'),
        heading('A decision journal creates leverage'),
        paragraph('Short written records preserve context, reveal patterns, and prevent teams from relitigating solved questions every quarter.'),
        heading('Each entry should capture'),
        bulletList([
          'What decision was made.',
          'Why it was made now.',
          'What alternatives were rejected.',
          'Who owns the follow-through.',
        ]),
      ],
    },
  },
  {
    title: 'The Case for Smaller Cross-Functional Project Teams',
    subtitle: 'Most coordination problems are team-shape problems in disguise.',
    tags: ['Teams', 'Execution', 'Collaboration'],
    views: 1268,
    authorEmail: 'sumit@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Large project teams create the appearance of resourcing strength, but they often introduce more coordination drag than delivery speed. Smaller cross-functional pods tend to make better decisions faster.'),
        heading('Why smaller teams work'),
        bulletList([
          'Ownership is easier to understand.',
          'Communication paths stay manageable.',
          'Dependencies become explicit instead of hidden in meetings.',
        ]),
        heading('The design principle'),
        paragraph('Form teams around outcomes, not just functions. Give them enough range to move and enough visibility to ask for help early.'),
      ],
    },
  },
  {
    title: 'What Internal Tools Get Wrong About Adoption',
    subtitle: 'Useful systems fail when they ask teams to do extra work just to stay organized.',
    tags: ['Internal Tools', 'Adoption', 'Product Strategy'],
    views: 931,
    authorEmail: 'vikram@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Internal tools fail less often because they are technically weak and more often because they create one more place where people have to remember to update context.'),
        heading('Adoption starts with default value'),
        paragraph('If the system saves time on day one, people come back. If it feels like administrative overhead, usage drops no matter how many features it has.'),
        heading('Design for pull, not push'),
        bulletList([
          'Show relevant information without extra setup.',
          'Connect related workflows so updates pay off immediately.',
          'Use lightweight defaults and progressive depth.',
        ]),
      ],
    },
  },
  {
    title: 'From Draft to Publish: Building a Healthy Editorial Workflow',
    subtitle: 'Content quality improves when authoring and publishing are different permissions.',
    tags: ['Content', 'Workflow', 'Governance'],
    views: 1117,
    authorEmail: 'deepa@orgsphere.io',
    content: {
      type: 'doc',
      content: [
        paragraph('Healthy editorial systems separate writing from publishing. More people should be able to contribute ideas than approve them for external visibility.'),
        heading('Why separation matters'),
        paragraph('Writers move faster when they can draft freely. Reviewers protect quality, accuracy, and consistency at the final stage.'),
        heading('A practical workflow'),
        orderedList([
          'Open drafting access to trusted contributors.',
          'Limit publish rights to designated reviewers.',
          'Keep visibility into draft ownership and status inside the workspace.',
        ]),
      ],
    },
  },
]

async function seed() {
  await AppDataSource.initialize()
  const postRepo = AppDataSource.getRepository(Post)
  const userRepo = AppDataSource.getRepository(User)

  const authors = await userRepo.find()
  const authorByEmail = new Map(authors.map((author) => [author.email, author]))

  await postRepo.clear()
  console.log('Cleared existing blog posts')

  for (let index = 0; index < postsData.length; index += 1) {
    const data = postsData[index]
    const author = authorByEmail.get(data.authorEmail)

    const post = postRepo.create({
      title: data.title,
      subtitle: data.subtitle,
      tags: data.tags,
      views: data.views,
      content: data.content,
      status: 'published',
      author_id: author?.id ?? null,
      slug: await generateUniqueSlug(data.title),
      reading_time: calculateReadingTime(data.content),
      published_at: new Date(Date.now() - (index + 1) * 2 * 24 * 60 * 60 * 1000),
      cover_image_url: null,
    })

    await postRepo.save(post)
    console.log(`Created post: ${data.title}`)
  }

  console.log(`Blog posts seed complete with ${postsData.length} published posts`)
  await AppDataSource.destroy()
}

seed().catch(async (error: unknown) => {
  console.error(error)
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
  process.exit(1)
})
