import { AppDataSource } from '../data-source'
import { Post } from '../entities/Post'

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200)

export const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const base = slugify(title) || 'untitled-post'
  const repo = AppDataSource.getRepository(Post)

  let slug = base
  let counter = 2

  while (true) {
    const qb = repo.createQueryBuilder('post').where('post.slug = :slug', { slug })
    if (excludeId) qb.andWhere('post.id != :id', { id: excludeId })
    const existing = await qb.getOne()

    if (!existing) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
}

const extractText = (node: TiptapNode): string => {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.content)) return node.content.map(extractText).join(' ')
  return ''
}

export const calculateReadingTime = (content: Record<string, unknown>): number => {
  try {
    const text = extractText(content as TiptapNode)
    const wordCount = text.split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(wordCount / 200))
  } catch {
    return 1
  }
}
