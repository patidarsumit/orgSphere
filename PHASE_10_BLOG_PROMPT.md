# OrgSphere — Blog Module Prompt
# Medium-style public blog for the landing page
# Paste this entire file into Claude Code or Codex

---

## CONTEXT

You are adding a Medium-style blog to OrgSphere.
All 8 phases + permissions are complete.

Read ARCHITECTURE.md at the project root before writing any code.

The blog is a PUBLIC feature — no login required to read posts.
Only admin users can write and publish posts (via the Settings panel).
The blog uses the same Tiptap editor already installed from Phase 6.

---

## WHAT ALREADY EXISTS (do not rebuild)

- Full app with auth, employees, teams, projects, tasks, notes, activity
- Tiptap v2 installed and working (used in My Notes)
- TiptapEditor component at components/notes/TiptapEditor.tsx
- Landing page at app/(public)/page.tsx (needs blog section added)
- Footer already has "Blog" link pointing to /blog
- Shared Zod schemas at /packages/schemas/

---

## TASK — Blog Module

Build end to end:
1. Backend: Post entity + CRUD API + slug generation
2. Backend: Tag system for posts
3. Frontend: Blog section on landing page
4. Frontend: /blog — public blog index page
5. Frontend: /blog/[slug] — individual article (Medium reading experience)
6. Frontend: /blog/tag/[tag] — tag filtered view
7. Frontend: Admin blog editor (write/edit/publish — inside Settings)
8. Frontend: Author profile on articles (links to employee profile for logged-in users)

---

## STEP 1 — Shared Zod schemas

### packages/schemas/post.schema.ts
```typescript
import { z } from 'zod'

export const postStatusEnum = z.enum(['draft', 'published', 'archived'])

export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  subtitle: z.string().max(500).optional(),
  content: z.record(z.unknown()).default({}),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: postStatusEnum.default('draft'),
  reading_time: z.coerce.number().min(1).default(1),
})

export const updatePostSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.record(z.unknown()).optional(),
  cover_image_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: postStatusEnum.optional(),
  reading_time: z.coerce.number().min(1).optional(),
})

export const postQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(9),
  tag: z.string().optional(),
  status: postStatusEnum.optional(),
  search: z.string().optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostQuery = z.infer<typeof postQuerySchema>
export type PostStatus = z.infer<typeof postStatusEnum>
```

Update packages/schemas/index.ts to export from post.schema.ts.

---

## STEP 2 — Backend: Post entity

### server/src/entities/Post.ts
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from './User'

export type PostStatus = 'draft' | 'published' | 'archived'

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  subtitle!: string | null

  // URL-friendly slug — generated from title
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 300 })
  slug!: string

  // Tiptap JSON content (same as notes)
  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, unknown>

  // Optional cover image URL (can be external URL or local upload path)
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image_url!: string | null

  @Column({ type: 'jsonb', default: [] })
  tags!: string[]

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status!: PostStatus

  // Estimated reading time in minutes
  @Column({ type: 'int', default: 1 })
  reading_time!: number

  // View count — incremented on each page visit
  @Column({ type: 'int', default: 0 })
  views!: number

  @Column({ type: 'uuid', nullable: true })
  author_id!: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author!: User | null

  // Published timestamp (set when status changes to 'published')
  @Column({ type: 'timestamp', nullable: true })
  published_at!: Date | null

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
```

### Update server/src/data-source.ts
```typescript
import { Post } from './entities/Post'
entities: [User, Team, Project, ProjectMember, Task, Note, ActivityLog, Post],
```

Generate and run migration:
```bash
cd server
npm run migration:generate -- -n CreatePostsTable
npm run migration:run
```

---

## STEP 3 — Backend: Slug utility

### server/src/utils/slug.ts
```typescript
import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'

// Convert title to URL-safe slug
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/[\s_-]+/g, '-')   // replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
    .substring(0, 200)          // max length
}

// Generate unique slug — appends -2, -3 etc. if slug already exists
export const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title)
  const repo = AppDataSource.getRepository(Post)

  let slug = base
  let counter = 2

  while (true) {
    const qb = repo.createQueryBuilder('post').where('post.slug = :slug', { slug })
    if (excludeId) qb.andWhere('post.id != :id', { id: excludeId })
    const existing = await qb.getOne()

    if (!existing) return slug
    slug = `${base}-${counter}`
    counter++
  }
}

// Calculate estimated reading time from Tiptap JSON content
export const calculateReadingTime = (content: Record<string, unknown>): number => {
  try {
    // Extract all text from Tiptap JSON nodes recursively
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text ?? ''
      if (node.content) return node.content.map(extractText).join(' ')
      return ''
    }
    const text = extractText(content)
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const wordsPerMinute = 200
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  } catch {
    return 1
  }
}
```

---

## STEP 4 — Backend: Post service

### server/src/services/post.service.ts
```typescript
import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'
import { ILike } from 'typeorm'
import { CreatePostInput, UpdatePostInput, PostQuery } from '@orgsphere/schemas'
import { generateUniqueSlug, calculateReadingTime } from '../utils/slug'

const repo = () => AppDataSource.getRepository(Post)

const selectAuthorFields = [
  'author.id', 'author.name', 'author.avatar_path',
  'author.role', 'author.department',
]

// PUBLIC: paginated published posts
export const findPublished = async (query: PostQuery) => {
  const { page, limit, tag, search } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([
      'post.id', 'post.title', 'post.subtitle', 'post.slug',
      'post.cover_image_url', 'post.tags', 'post.reading_time',
      'post.views', 'post.published_at', 'post.created_at',
      ...selectAuthorFields,
    ])
    .where('post.status = :status', { status: 'published' })
    .orderBy('post.published_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (tag) {
    qb = qb.andWhere("post.tags::text ILIKE :tag", { tag: `%${tag}%` })
  }
  if (search) {
    qb = qb.andWhere('post.title ILIKE :search', { search: `%${search}%` })
  }

  const [posts, total] = await qb.getManyAndCount()
  return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// PUBLIC: single post by slug + increment view count
export const findBySlug = async (slug: string) => {
  const post = await repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([
      'post.id', 'post.title', 'post.subtitle', 'post.slug',
      'post.content', 'post.cover_image_url', 'post.tags',
      'post.reading_time', 'post.views', 'post.published_at',
      'post.status', 'post.created_at', 'post.updated_at',
      ...selectAuthorFields,
    ])
    .where('post.slug = :slug', { slug })
    .andWhere('post.status = :status', { status: 'published' })
    .getOne()

  if (post) {
    // Increment view count asynchronously
    repo().increment({ id: post.id }, 'views', 1).catch(() => {})
  }

  return post
}

// PUBLIC: all unique tags from published posts
export const getAllTags = async (): Promise<string[]> => {
  const posts = await repo()
    .createQueryBuilder('post')
    .select('post.tags')
    .where('post.status = :status', { status: 'published' })
    .getMany()

  const all = posts.flatMap((p) => p.tags)
  return [...new Set(all)].sort()
}

// PUBLIC: featured post (most viewed published post)
export const getFeatured = async () => {
  return repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([
      'post.id', 'post.title', 'post.subtitle', 'post.slug',
      'post.cover_image_url', 'post.tags', 'post.reading_time',
      'post.views', 'post.published_at',
      ...selectAuthorFields,
    ])
    .where('post.status = :status', { status: 'published' })
    .orderBy('post.views', 'DESC')
    .getOne()
}

// ADMIN: all posts including drafts
export const findAll = async (query: PostQuery) => {
  const { page, limit, status, search } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([
      'post.id', 'post.title', 'post.slug', 'post.status',
      'post.tags', 'post.reading_time', 'post.views',
      'post.published_at', 'post.created_at',
      ...selectAuthorFields,
    ])
    .orderBy('post.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (status) qb = qb.where('post.status = :status', { status })
  if (search) qb = qb.andWhere('post.title ILIKE :search', { search: `%${search}%` })

  const [posts, total] = await qb.getManyAndCount()
  return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ADMIN: get full post for editing
export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([
      'post.id', 'post.title', 'post.subtitle', 'post.slug',
      'post.content', 'post.cover_image_url', 'post.tags',
      'post.status', 'post.reading_time', 'post.views',
      'post.published_at', 'post.created_at', 'post.updated_at',
      ...selectAuthorFields,
    ])
    .where('post.id = :id', { id })
    .getOne()
}

export const create = async (input: CreatePostInput, authorId: string) => {
  const slug = await generateUniqueSlug(input.title)
  const reading_time = calculateReadingTime(input.content)

  const post = repo().create({
    ...input,
    slug,
    reading_time,
    author_id: authorId,
    published_at: input.status === 'published' ? new Date() : null,
  })
  return repo().save(post)
}

export const update = async (id: string, input: UpdatePostInput) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')

  // Regenerate slug if title changed
  if (input.title && input.title !== post.title) {
    post.slug = await generateUniqueSlug(input.title, id)
  }

  // Recalculate reading time if content changed
  if (input.content) {
    post.reading_time = calculateReadingTime(input.content)
  }

  // Set published_at timestamp when first publishing
  if (input.status === 'published' && post.status !== 'published') {
    post.published_at = new Date()
  }

  Object.assign(post, input)
  return repo().save(post)
}

export const remove = async (id: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  await repo().remove(post)
}

// ADMIN: publish a draft post
export const publish = async (id: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  post.status = 'published'
  post.published_at = post.published_at ?? new Date()
  return repo().save(post)
}

// ADMIN: unpublish back to draft
export const unpublish = async (id: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  post.status = 'draft'
  return repo().save(post)
}
```

---

## STEP 5 — Backend: Post controller + routes

### server/src/controllers/post.controller.ts
```typescript
import { Request, Response } from 'express'
import * as PostService from '../services/post.service'
import { postQuerySchema } from '@orgsphere/schemas'
import { AuthRequest } from '../middleware/auth'

// ─── Public routes ────────────────────────────────────────────────

export const getPublished = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = postQuerySchema.parse(req.query)
    const result = await PostService.findPublished(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts' })
  }
}

export const getBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.findBySlug(req.params.slug)
    if (!post) {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    res.json(post)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post' })
  }
}

export const getTags = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tags = await PostService.getAllTags()
    res.json(tags)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tags' })
  }
}

export const getFeatured = async (_req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.getFeatured()
    res.json(post ?? null)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured post' })
  }
}

// ─── Admin routes ─────────────────────────────────────────────────

export const getAllAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = postQuerySchema.parse(req.query)
    const result = await PostService.findAll(query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch posts' })
  }
}

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.findById(req.params.id)
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    res.json(post)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post' })
  }
}

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await PostService.create(req.body, req.user!.id)
    res.status(201).json(post)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' })
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.update(req.params.id, req.body)
    res.json(post)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' })
      return
    }
    res.status(500).json({ message: 'Failed to update post' })
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    await PostService.remove(req.params.id)
    res.json({ message: 'Post deleted' })
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' }); return
    }
    res.status(500).json({ message: 'Failed to delete post' })
  }
}

export const publish = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.publish(req.params.id)
    res.json(post)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' }); return
    }
    res.status(500).json({ message: 'Failed to publish post' })
  }
}

export const unpublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await PostService.unpublish(req.params.id)
    res.json(post)
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({ message: 'Post not found' }); return
    }
    res.status(500).json({ message: 'Failed to unpublish post' })
  }
}
```

### server/src/routes/post.routes.ts
```typescript
import { Router } from 'express'
import {
  getPublished, getBySlug, getTags, getFeatured,
  getAllAdmin, getById, create, update, remove, publish, unpublish
} from '../controllers/post.controller'
import { authMiddleware } from '../middleware/auth'
import { adminOnly } from '../middleware/permissions'
import { validate } from '../middleware/validate'
import { createPostSchema, updatePostSchema } from '@orgsphere/schemas'

const router = Router()

// ─── PUBLIC routes (no auth required) ────────────────────────────
router.get('/public',            getPublished)
router.get('/public/featured',   getFeatured)
router.get('/public/tags',       getTags)
router.get('/public/:slug',      getBySlug)

// ─── ADMIN routes (auth + admin role required) ────────────────────
router.use(authMiddleware, adminOnly)
router.get('/',                  getAllAdmin)
router.get('/:id',               getById)
router.post('/', validate(createPostSchema), create)
router.put('/:id', validate(updatePostSchema), update)
router.delete('/:id',            remove)
router.post('/:id/publish',      publish)
router.post('/:id/unpublish',    unpublish)

export default router
```

Register in server/src/app.ts:
```typescript
import postRoutes from './routes/post.routes'
app.use('/api/posts', postRoutes)
```

---

## STEP 6 — Backend: Seed blog posts

### server/src/seeds/posts.seed.ts
```typescript
import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'
import { User } from '../entities/User'
import { generateUniqueSlug } from '../utils/slug'

const postsData = [
  {
    title: 'Why Org Visibility is the Competitive Advantage You\'re Ignoring',
    subtitle: 'Most companies obsess over strategy. The best ones obsess over clarity.',
    tags: ['Leadership', 'Culture', 'Productivity'],
    status: 'published' as const,
    views: 1240,
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'In the modern enterprise, the biggest bottleneck is rarely talent, technology, or capital. It is clarity — specifically, who is working on what, why it matters, and how it connects to everything else.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The invisible tax of opacity' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Every hour a senior engineer spends hunting for context is an hour not spent building. Every meeting that exists solely to synchronize information is a meeting that did not need to happen. This is the invisible tax of organizational opacity — and it compounds.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'What radical transparency actually looks like' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Radical transparency is not about sharing everything with everyone. It is about making the right information findable by the right people at the right time. Project status, team composition, role clarity, dependency mapping — these are not nice-to-haves. They are force multipliers.' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New engineers onboard 60% faster when org structure is visible' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cross-team collaboration increases when people can discover expertise' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Duplicate work decreases when project visibility is centralised' }] }] },
        ]},
        { type: 'paragraph', content: [{ type: 'text', text: 'The companies that will win the next decade are not the ones with the best engineers — they are the ones where every engineer knows exactly how their work connects to the whole.' }] },
      ],
    },
  },
  {
    title: 'Building High-Trust Engineering Teams: A Practical Guide',
    subtitle: 'Trust is not a soft skill. It is an engineering practice.',
    tags: ['Engineering', 'Teams', 'Leadership'],
    status: 'published' as const,
    views: 892,
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'High-trust engineering teams ship faster, have lower attrition, and produce better software. The research on this is unambiguous. What is less clear is how to actually build trust — systematically, repeatably, at scale.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Trust is built in small moments' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Trust is not built in all-hands meetings or team offsites. It is built in the daily interactions — the code review that was encouraging instead of dismissive, the question that was answered without judgment, the credit that was given publicly.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The three pillars of engineering trust' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Predictability: do people do what they say they will do?' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Competence: do people trust each other\'s technical judgment?' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Benevolence: do people believe others have their best interests in mind?' }] }] },
        ]},
        { type: 'paragraph', content: [{ type: 'text', text: 'The practical implication is that trust-building is a system design problem. You design the systems — the processes, the tools, the rituals — that make trust the path of least resistance.' }] },
      ],
    },
  },
  {
    title: 'The Hidden Cost of Poor Project Visibility',
    subtitle: 'You cannot optimise what you cannot see.',
    tags: ['Projects', 'Productivity', 'Culture'],
    status: 'published' as const,
    views: 567,
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Ask any engineering manager to list their biggest challenges and somewhere in the top five you will find a variation of: "I don\'t always know what my team is actually working on." This is not a people problem. It is a systems problem.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The four failure modes of project opacity' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'When projects lack visibility, four things consistently go wrong: duplicate work across teams, misaligned priorities, missed dependencies, and delayed escalations. Each of these is expensive in its own right. Together, they are catastrophic.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The solution is not more meetings. It is better infrastructure — the kind that makes project status, ownership, and progress legible to everyone who needs it, without requiring anyone to ask.' }] },
      ],
    },
  },
  {
    title: 'How We Built OrgSphere: Technical Decisions That Mattered',
    subtitle: 'A behind-the-scenes look at the architecture choices that shaped our product.',
    tags: ['Engineering', 'Product', 'Technical'],
    status: 'published' as const,
    views: 2103,
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Building an internal collaboration platform means making hundreds of small decisions that compound over time. Here are the ones that mattered most — and what we would do differently.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'The monorepo decision' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'We chose a monorepo from day one. The killer feature: shared Zod schemas between the frontend and backend. When we change a validation rule in the schema, both the API and the form validation update together. No drift. No mismatches.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'State management philosophy' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'The biggest mistake teams make with Redux is using it for everything including server data. We use Redux Toolkit only for client UI state: auth, sidebar, modals, toasts. All server data lives in TanStack Query. This separation keeps the store tiny and the data always fresh.' }] },
        { type: 'codeBlock', attrs: { language: 'typescript' }, content: [{ type: 'text', text: '// Redux: UI state only\nstore: {\n  auth: { user, token, isAuthenticated },\n  ui: { sidebarOpen, activeModal, toasts }\n}\n\n// TanStack Query: all server data\nuseQuery({ queryKey: [\'projects\'], ... })\nuseQuery({ queryKey: [\'employees\'], ... })' }] },
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

  for (let i = 0; i < postsData.length; i++) {
    const pd = postsData[i]
    const exists = await postRepo.findOne({ where: { title: pd.title } })
    if (exists) { console.log(`⏭️  Skipped: ${pd.title}`); continue }

    const slug = await generateUniqueSlug(pd.title)
    const post = postRepo.create({
      ...pd,
      slug,
      author_id: authors[i]?.id ?? null,
      reading_time: Math.ceil(JSON.stringify(pd.content).length / 1200),
      published_at: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000),
    })
    await postRepo.save(post)
    console.log(`✅ Created post: ${pd.title}`)
  }

  console.log('🌱 Blog posts seed complete')
  await AppDataSource.destroy()
}

seed().catch(console.error)
```

Add to server/package.json:
```json
"seed:blog": "ts-node src/seeds/posts.seed.ts"
```

Run: `npm run seed:blog`

---

## STEP 7 — Frontend: Blog types + hooks

### Add to client/types/index.ts
```typescript
export interface BlogPost {
  id: string
  title: string
  subtitle: string | null
  slug: string
  cover_image_url: string | null
  tags: string[]
  reading_time: number
  views: number
  published_at: string | null
  created_at: string
  updated_at: string
  status?: PostStatus
  content?: Record<string, unknown>
  author: {
    id: string
    name: string
    avatar_path: string | null
    role: UserRole
    department: string | null
  } | null
}

export type PostStatus = 'draft' | 'published' | 'archived'

export interface BlogPaginatedResponse {
  data: BlogPost[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

### client/hooks/useBlog.ts
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { BlogPost, BlogPaginatedResponse } from '@/types'

// Public hooks — no auth required
export const usePublishedPosts = (filters: { page?: number; limit?: number; tag?: string; search?: string } = {}) => {
  return useQuery<BlogPaginatedResponse>({
    queryKey: ['blog-posts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/posts/public?${params}`)
      return data
    },
    staleTime: 60_000,
  })
}

export const useFeaturedPost = () => {
  return useQuery<BlogPost | null>({
    queryKey: ['blog-featured'],
    queryFn: async () => {
      const { data } = await api.get('/posts/public/featured')
      return data
    },
    staleTime: 60_000,
  })
}

export const usePostBySlug = (slug: string) => {
  return useQuery<BlogPost>({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/posts/public/${slug}`)
      return data
    },
    enabled: !!slug,
    staleTime: 30_000,
  })
}

export const useBlogTags = () => {
  return useQuery<string[]>({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data } = await api.get('/posts/public/tags')
      return data
    },
    staleTime: 300_000,
  })
}

// Admin hooks — require auth + admin role
export const useAllPostsAdmin = (filters: { page?: number; status?: string; search?: string } = {}) => {
  return useQuery<BlogPaginatedResponse>({
    queryKey: ['blog-posts-admin', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/posts?${params}`)
      return data
    },
    staleTime: 30_000,
  })
}

export const usePostByIdAdmin = (id: string) => {
  return useQuery<BlogPost>({
    queryKey: ['blog-post-admin', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export const useCreatePost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post('/posts', input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}

export const useUpdatePost = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.put(`/posts/${id}`, input)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      qc.invalidateQueries({ queryKey: ['blog-post-admin', id] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}

export const usePublishPost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/posts/${id}/publish`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}

export const useUnpublishPost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/posts/${id}/unpublish`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}

export const useDeletePost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      qc.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}
```

---

## STEP 8 — Frontend: Blog section on landing page

### Update app/(public)/page.tsx

Add a blog section between the Features section and the CTA banner:

```
BLOG SECTION DESIGN:
Background: white
Max width: 1200px centered, padding 80px 0

Section header (centered):
  Eyebrow: "FROM THE BLOG" (11px, indigo-600, uppercase, letter-spacing)
  Title: "Insights on org design and team performance" (32px/600)
  Subtitle: "Practical thinking on how modern companies work better." (16px, gray-500)
  "View all articles →" link (indigo, right of subtitle row)

FEATURED POST (large card, full width, mb-12):
  Layout: horizontal (image left 45%, content right 55%) on desktop
  Image area: rounded-xl, bg-gradient-to-br from-indigo-50 to-indigo-100
              Show large tag chip centered in image area (as placeholder for cover)
  Content:
    Tag chip (indigo bg, white text)
    Title (24px/600, 2 lines max, hover:text-indigo-600)
    Subtitle (15px, gray-600, 3 lines max)
    Author row: Avatar (32px) + Name + role + "•" + published date + "•" + X min read
  Clicking anywhere → /blog/{slug}

POST GRID (3 columns, show 3 most recent non-featured):
  Each card:
    Cover area: 200px height, rounded-t-xl
      bg color derived from first tag (indigo/teal/purple/amber)
      Large tag text centered (decorative)
    Card body (white, rounded-b-xl, p-5, border gray-100):
      Tag chip (small, colored)
      Title (16px/600, 2 lines max, hover:text-indigo-600)
      Subtitle (13px, gray-500, 2 lines max)
      Footer row:
        Avatar (24px) + Author name (12px)
        Right: published date + read time
  Card hover: shadow-md, translateY(-2px), transition 200ms
  Clicking card → /blog/{slug}

LOADING STATE:
  1 large skeleton + 3 small skeleton cards

EMPTY STATE (no posts yet):
  Don't show the section at all if no posts exist
```

---

## STEP 9 — Frontend: Blog index page

### app/(public)/blog/page.tsx

```
This is a PUBLIC page — no sidebar, no header (or minimal public nav)
Uses the same public navbar as the landing page (OrgSphere logo + Login button)

LAYOUT:
  Max width 1200px centered

PAGE HEADER:
  "OrgSphere Blog" (40px/700)
  "Insights on organizational design, team performance, and the future of work." (18px, gray-500)

TAG FILTER BAR (below header):
  "All" chip (active by default) + one chip per tag
  Active chip: indigo filled, white text
  Inactive: gray-100 bg, gray-700 text
  nuqs: ?tag= for URL state
  All tags fetched from GET /api/posts/public/tags

FEATURED POST (same design as landing page blog section)
  Only show if no tag filter is active

ARTICLES GRID:
  3 columns (xl), 2 columns (md), 1 column (sm)
  Same card design as landing page grid
  Load more button at bottom (not infinite scroll — simpler)
    "Load more articles" (outlined button)
    Hides when totalPages reached

SIDEBAR (optional — 280px right column on desktop):
  "Popular Tags" section: tag chips with post count
  "Recent Posts" section: last 5 titles as text links

EMPTY STATE (filtered, no results):
  "No articles tagged '{tag}' yet"
  "Browse all articles →" button

SEO METADATA:
  export const metadata = {
    title: 'Blog | OrgSphere',
    description: 'Insights on org design, team performance, and the future of work.',
  }
```

---

## STEP 10 — Frontend: Blog tag page

### app/(public)/blog/tag/[tag]/page.tsx

```typescript
// Thin wrapper around blog index — passes tag as filter
// Title: "Articles tagged: {tag}" (32px/600)
// Subtitle: "{N} articles" count
// Same grid layout as /blog
// Back link: "← All articles"

export async function generateMetadata({ params }: { params: { tag: string } }) {
  return {
    title: `${params.tag} | OrgSphere Blog`,
    description: `Articles about ${params.tag} from the OrgSphere blog.`,
  }
}
```

---

## STEP 11 — Frontend: Blog article page (Medium-style)

### app/(public)/blog/[slug]/page.tsx

This is the most important page — the reading experience.

```
PUBLIC PAGE — same public nav as landing page

LAYOUT: max-width 680px centered (Medium uses narrow columns for readability)
Background: white

ARTICLE HEADER:
  Tag chips (indigo pills, multiple)
  Title (40px/700, line-height 1.2, letter-spacing -0.02em)
  Subtitle (20px/400, gray-600, line-height 1.5, mt-4)

  Author bar (mt-6, border-top + border-bottom gray-100, py-4):
  [Avatar 48px] | Author name (15px/500) + role (13px, gray)
                 Published: {date formatted as "October 24, 2024"}
                 {X} min read · {N} views

  Cover image (if exists):
    Full width (max 680px), rounded-xl, mt-8
    Aspect ratio 16:9

ARTICLE BODY (mt-8):
  Render Tiptap JSON as HTML using the TiptapEditor in read-only mode:
    editable={false}
    content={post.content}

  Prose typography (add to globals.css or use Tailwind prose):
    Body text: 18px, line-height 1.8, color gray-800
    H2: 26px/600, mt-10 mb-4, color gray-900
    H3: 20px/600, mt-8 mb-3
    Paragraphs: mb-6
    Bullet/numbered lists: ml-6, mb-4, space-y-2
    Code blocks: bg-gray-950, text-green-400, rounded-xl, p-6, font-mono 14px, overflow-x-auto
    Inline code: bg-gray-100, px-1.5, rounded, font-mono 15px
    Blockquote: border-l-4 border-indigo-400, pl-6, italic, text-gray-600
    Links: text-indigo-600, underline-offset-2, hover:underline

ARTICLE FOOTER:
  Divider
  Tags section: "Tagged in:" + tag chips (clickable → /blog/tag/{tag})

  Author card (white, rounded-xl, border, p-6):
    Avatar (56px) + "Written by" label + Name (18px/600) + role
    Department chip
    If author has employee profile (author_id exists):
      "View profile" link → /employees/{author_id}
      (only shown to logged-in users)

  "More articles" section (3 cards, same tag or same author):
    Fetched from: GET /api/posts/public?tag={firstTag}&limit=3
    Filter out current article

NOT FOUND STATE:
  "Article not found" + back to blog button

SEO METADATA:
export async function generateMetadata({ params }: { params: { slug: string } }) {
  // fetch post by slug
  return {
    title: `${post.title} | OrgSphere Blog`,
    description: post.subtitle ?? post.title,
    openGraph: {
      title: post.title,
      description: post.subtitle ?? '',
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      authors: [post.author?.name ?? 'OrgSphere'],
    },
  }
}
```

---

## STEP 12 — Frontend: Admin blog management in Settings

### Update app/(app)/settings/page.tsx

Add a "Blog" tab to the existing Settings left nav:

```
New tab: [BookOpen icon] Blog

BLOG SETTINGS TAB:
  Header: "Blog Management" + "+ New Post" button (primary indigo)

  STATUS FILTER TABS: All | Published | Drafts | Archived

  POSTS TABLE:
  Columns: Title | Status | Tags | Author | Views | Published | Actions

  Row details:
    Title: 15px/500, truncated 60 chars, clickable → /blog/{slug} (opens new tab)
    Status badge: published=green, draft=amber, archived=gray
    Tags: first 2 tag chips
    Author: Avatar (24px) + name
    Views: number with eye icon
    Published: date or "—" for drafts
    Actions (3-dot menu):
      "Edit" → opens PostEditorModal
      "View" → /blog/{slug} (new tab, only if published)
      "Publish" / "Unpublish" toggle
      divider
      "Delete" → ConfirmDialog

EMPTY STATE: "No blog posts yet" + "Write your first post" button
```

### components/blog/PostEditorModal.tsx

The write/edit experience — full-screen modal:

```
Props:
  open: boolean
  onClose: () => void
  postId?: string  (edit mode if provided)

DESIGN: Full-screen modal (not a dialog — takes entire viewport)
  Fixed inset-0, white bg, z-[60]
  Two panel layout: editor left (flex-1) + settings sidebar right (320px)

LEFT — EDITOR PANEL:
  Sticky top bar (56px, white, border-bottom):
    "← Back" button (closes modal, with unsaved changes warning)
    Title: "New Post" or "Editing: {title}"
    Right: "Save Draft" button + "Publish" button (primary indigo)

  Content area (scrollable, max-width 720px, mx-auto, pt-8):
    Title input (full width, 32px, no border, placeholder "Post title...")
    Subtitle input (full width, 18px, gray, no border, placeholder "Add a subtitle...")
    Divider
    TiptapEditor component (same as My Notes)
      onChange: auto-saves draft every 2 seconds (debounced)
      placeholder "Tell your story..."

RIGHT — SETTINGS PANEL (320px, border-left, overflow-y-auto):
  Sticky top bar (56px, white, border-bottom):
    "Post settings" label (13px/500, gray)

  Settings sections:

  Section: Status
    StatusBadge showing current status
    If draft: "Ready to publish? Click Publish above."

  Section: Cover Image
    URL input: "Cover image URL (optional)"
    Preview (if URL provided): img thumbnail

  Section: Tags
    Tag input (same pattern as My Notes tags)
    Type + Enter to add, × to remove
    Existing blog tags shown as suggestions below input

  Section: Reading time
    Auto-calculated (read-only): "{N} min read"
    Calculated from content word count

  Section: Author
    Shows current user as author (read-only)
    Avatar + name + role

  Section: SEO Preview (collapsed by default):
    Expandable card showing how post appears in search:
      Title (truncated 60 chars)
      URL: orgsphere.io/blog/{slug}
      Description: subtitle or first 160 chars of content

UNSAVED CHANGES:
  Track isDirty state
  On close with unsaved changes: show ConfirmDialog
    "You have unsaved changes. Leave without saving?"
    "Save Draft" | "Discard" | "Cancel"

AUTO-SAVE:
  Every 2 seconds while editing (debounced)
  Shows "Saving..." → "Draft saved" indicator in top bar
  Same pattern as My Notes editor
```

---

## STEP 13 — Frontend: Update landing page footer Blog link

### Update app/(public)/page.tsx footer section

The "Blog" link in the footer already exists — verify it points to `/blog`:
```
COMPANY column → "Blog" link → href="/blog"
```

Also add the blog section (Step 8) between Features and CTA sections.

---

## STEP 14 — Frontend: Public navigation component

### components/public/PublicNav.tsx

Create a reusable public navigation bar used across all public pages
(landing, blog index, blog article):

```typescript
// Logo: indigo dot + "OrgSphere" wordmark
// Right:
//   "Blog" link → /blog (active state: indigo-600)
//   "Login" button (outlined indigo)
// Height: 56px, white bg, bottom border gray-100
// Sticky top-0, z-40
// Max-width 1200px centered

// Mobile: hamburger menu with Blog + Login
```

---

## ACCEPTANCE CRITERIA — Blog is complete when:

Backend:
- [ ] GET /api/posts/public returns paginated published posts
- [ ] GET /api/posts/public/featured returns most-viewed post
- [ ] GET /api/posts/public/tags returns all unique tags
- [ ] GET /api/posts/public/:slug returns post + increments view count
- [ ] GET /api/posts (admin) returns all posts including drafts
- [ ] POST /api/posts (admin) creates post with auto-generated slug
- [ ] PUT /api/posts/:id (admin) updates post + recalculates reading time
- [ ] POST /api/posts/:id/publish sets status=published + published_at
- [ ] POST /api/posts/:id/unpublish sets status back to draft
- [ ] DELETE /api/posts/:id (admin) removes post
- [ ] Seed: 4 published posts visible at /api/posts/public

Frontend — Landing page:
- [ ] Blog section appears between Features and CTA on landing page
- [ ] Featured post card renders correctly
- [ ] 3 recent post cards render in grid
- [ ] Clicking any post card navigates to /blog/{slug}
- [ ] "View all articles →" link navigates to /blog

Frontend — Blog index (/blog):
- [ ] /blog loads without requiring login
- [ ] All published posts shown in grid
- [ ] Tag filter chips filter posts correctly
- [ ] "Load more" button loads next page
- [ ] URL updates when tag filter changes (?tag=Engineering)
- [ ] /blog/tag/Engineering shows filtered posts
- [ ] Empty state shows when filtered tag has no posts

Frontend — Article page (/blog/[slug]):
- [ ] /blog/[slug] loads without login
- [ ] Article title, subtitle, author, date, read time all render
- [ ] Tiptap content renders correctly (headings, lists, code blocks)
- [ ] Code blocks have dark bg + monospace font
- [ ] "More articles" section shows 3 related posts
- [ ] Author card shows with "View profile" link (for logged-in users)
- [ ] Tag chips link to /blog/tag/{tag}
- [ ] View count increments on each visit
- [ ] 404 page shows for non-existent slug

Frontend — Admin blog editor:
- [ ] "Blog" tab appears in Settings page sidebar
- [ ] Posts table shows all posts with status badges
- [ ] "+ New Post" opens full-screen editor modal
- [ ] Title + subtitle inputs work
- [ ] Tiptap editor works (bold, italic, headings, lists, code)
- [ ] Tags input works (add + remove)
- [ ] Auto-save every 2 seconds (shows "Draft saved")
- [ ] "Publish" button publishes post → status changes to published
- [ ] "Unpublish" returns to draft
- [ ] Edit mode pre-fills all fields
- [ ] Delete with ConfirmDialog works

SEO:
- [ ] /blog has correct page title and meta description
- [ ] /blog/[slug] has post title, description, and OpenGraph tags
- [ ] /blog/tag/[tag] has correct title

Code quality:
- [ ] Zero TypeScript errors (tsc --noEmit)
- [ ] No console errors in browser
- [ ] Blog pages accessible without auth (public routes)
