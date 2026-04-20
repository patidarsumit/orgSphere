import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { BlogPost } from '@/types'
import { authorName, firstTag, formatDate, tagTone } from './blogUtils'

export function FeaturedPostCard({ post }: { post: BlogPost }) {
  const tag = firstTag(post)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-gray-100 lg:grid-cols-[0.45fr_0.55fr]"
    >
      <div className={`grid min-h-[300px] place-items-center bg-gradient-to-br ${tagTone(tag)} p-8`}>
        <div className="text-center">
          <span className="rounded-full bg-white/70 px-5 py-2 text-xs font-black uppercase tracking-[0.2em]">
            Featured
          </span>
          <p className="mt-6 font-display text-4xl font-black tracking-tight">{tag}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <span className="w-fit rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          {tag}
        </span>
        <h3 className="mt-5 text-2xl font-black leading-tight text-gray-950 group-hover:text-indigo-600 sm:text-3xl">
          {post.title}
        </h3>
        <p className="mt-4 line-clamp-3 text-base leading-7 text-gray-500">
          {post.subtitle || 'A practical OrgSphere perspective for high-clarity teams.'}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="md" />
            <div>
              <p className="text-sm font-black text-gray-900">{authorName(post)}</p>
              <p className="text-xs text-gray-500">
                {post.author?.role ?? 'editor'} · {formatDate(post.published_at)} · {post.reading_time} min read
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-black text-indigo-600">
            Read more <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}
