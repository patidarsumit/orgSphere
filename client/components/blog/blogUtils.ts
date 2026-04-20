import { BlogPost } from '@/types'

export const tagTone = (tag?: string) => {
  const tones = [
    'from-indigo-50 to-indigo-100 text-indigo-700',
    'from-teal-50 to-teal-100 text-teal-700',
    'from-purple-50 to-purple-100 text-purple-700',
    'from-amber-50 to-amber-100 text-amber-700',
  ]
  const index = Array.from(tag || 'OrgSphere').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tones[index % tones.length]
}

export const formatDate = (date?: string | null, options: Intl.DateTimeFormatOptions = {}) => {
  if (!date) return 'Unpublished'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

export const authorName = (post: BlogPost) => post.author?.name ?? 'OrgSphere Editorial'

export const firstTag = (post: BlogPost) => post.tags[0] ?? 'OrgSphere'
