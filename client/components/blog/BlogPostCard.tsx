import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { BlogPost } from '@/types'
import { authorName, firstTag, formatDate, tagTone } from './blogUtils'

export function BlogPostCard({ post }: { post: BlogPost }) {
  const tag = firstTag(post)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_-24px_rgba(21,28,39,0.3)] ring-1 ring-gray-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
    >
      <div className={`grid h-48 place-items-center bg-gradient-to-br ${tagTone(tag)}`}>
        <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
          {tag}
        </span>
      </div>
      <div className="p-5">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-indigo-600">
          {tag}
        </span>
        <h3 className="mt-4 line-clamp-2 text-base font-black leading-6 text-gray-950 group-hover:text-indigo-600">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
          {post.subtitle || 'Practical thinking for modern teams.'}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="sm" />
            <span className="truncate font-semibold text-gray-600">{authorName(post)}</span>
          </div>
          <span className="shrink-0">
            {formatDate(post.published_at)} · {post.reading_time} min
          </span>
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600">
          Read article <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  )
}
