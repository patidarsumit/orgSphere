import { PostQuery, CreatePostInput, UpdatePostInput } from '@orgsphere/schemas'
import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'
import * as ActivityService from './activity.service'
import { calculateReadingTime, generateUniqueSlug } from '../utils/slug'

const repo = () => AppDataSource.getRepository(Post)

const selectAuthorFields = [
  'author.id',
  'author.name',
  'author.avatar_path',
  'author.role',
  'author.department',
]

const postListFields = [
  'post.id',
  'post.title',
  'post.subtitle',
  'post.slug',
  'post.cover_image_url',
  'post.tags',
  'post.status',
  'post.reading_time',
  'post.views',
  'post.published_at',
  'post.created_at',
  'post.updated_at',
]

const postDetailFields = [...postListFields, 'post.content']

export const findPublished = async (query: PostQuery) => {
  const { page, limit, tag, search } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([...postListFields, ...selectAuthorFields])
    .where('post.status = :status', { status: 'published' })
    .orderBy('post.published_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (tag) {
    qb = qb.andWhere("post.tags::text ILIKE :tag", { tag: `%${tag}%` })
  }

  if (search) {
    qb = qb.andWhere('(post.title ILIKE :search OR post.subtitle ILIKE :search)', {
      search: `%${search}%`,
    })
  }

  const [posts, total] = await qb.getManyAndCount()

  return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const findBySlug = async (slug: string) => {
  const post = await repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([...postDetailFields, ...selectAuthorFields])
    .where('post.slug = :slug', { slug })
    .andWhere('post.status = :status', { status: 'published' })
    .getOne()

  if (post) {
    void repo().increment({ id: post.id }, 'views', 1)
  }

  return post
}

export const getAllTags = async (): Promise<string[]> => {
  const posts = await repo()
    .createQueryBuilder('post')
    .select('post.tags')
    .where('post.status = :status', { status: 'published' })
    .getMany()

  return [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b))
}

export const getFeatured = async () => {
  return repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([...postListFields, ...selectAuthorFields])
    .where('post.status = :status', { status: 'published' })
    .orderBy('post.views', 'DESC')
    .addOrderBy('post.published_at', 'DESC')
    .getOne()
}

export const findAll = async (query: PostQuery) => {
  const { page, limit, status, search } = query
  const skip = (page - 1) * limit

  let qb = repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([...postListFields, ...selectAuthorFields])
    .orderBy('post.created_at', 'DESC')
    .skip(skip)
    .take(limit)

  if (status) qb = qb.andWhere('post.status = :status', { status })
  if (search) {
    qb = qb.andWhere('(post.title ILIKE :search OR post.subtitle ILIKE :search)', {
      search: `%${search}%`,
    })
  }

  const [posts, total] = await qb.getManyAndCount()
  return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const findById = async (id: string) => {
  return repo()
    .createQueryBuilder('post')
    .leftJoin('post.author', 'author')
    .select([...postDetailFields, ...selectAuthorFields])
    .where('post.id = :id', { id })
    .getOne()
}

export const create = async (input: CreatePostInput, authorId?: string) => {
  const slug = await generateUniqueSlug(input.title)
  const readingTime = calculateReadingTime(input.content)
  const post = repo().create({
    ...input,
    subtitle: input.subtitle ?? null,
    cover_image_url: input.cover_image_url ?? null,
    slug,
    reading_time: readingTime,
    author_id: authorId ?? null,
    published_at: input.status === 'published' ? new Date() : null,
  })
  const saved = await repo().save(post)
  await ActivityService.log({
    action: 'created',
    entity_type: 'post',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: authorId,
  })
  return findById(saved.id)
}

export const update = async (id: string, input: UpdatePostInput, actorId?: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')

  if (input.title && input.title !== post.title) {
    post.slug = await generateUniqueSlug(input.title, id)
  }

  if (input.content) {
    post.reading_time = calculateReadingTime(input.content)
  }

  if (input.status === 'published' && post.status !== 'published') {
    post.published_at = new Date()
  }

  Object.assign(post, input)
  const saved = await repo().save(post)
  await ActivityService.log({
    action: 'updated',
    entity_type: 'post',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: actorId,
  })
  return findById(saved.id)
}

export const remove = async (id: string, actorId?: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  await repo().remove(post)
  await ActivityService.log({
    action: 'deleted',
    entity_type: 'post',
    entity_id: id,
    entity_name: post.title,
    actor_id: actorId,
  })
}

export const publish = async (id: string, actorId?: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  post.status = 'published'
  post.published_at = post.published_at ?? new Date()
  const saved = await repo().save(post)
  await ActivityService.log({
    action: 'status_changed',
    entity_type: 'post',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: actorId,
    metadata: { status: 'published' },
  })
  return findById(saved.id)
}

export const unpublish = async (id: string, actorId?: string) => {
  const post = await repo().findOne({ where: { id } })
  if (!post) throw new Error('NOT_FOUND')
  post.status = 'draft'
  const saved = await repo().save(post)
  await ActivityService.log({
    action: 'status_changed',
    entity_type: 'post',
    entity_id: saved.id,
    entity_name: saved.title,
    actor_id: actorId,
    metadata: { status: 'draft' },
  })
  return findById(saved.id)
}
