import Link from 'next/link'
import { Avatar } from '@/components/shared/Avatar'
import { BlogPost } from '@/types'
import { authorName, firstTag, formatDate, tagTone } from './blogUtils'

export function FeaturedPostCard({ post }: { post: BlogPost }) {
  const tag = firstTag(post)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group mb-16 grid overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-surface-card)] lg:min-h-[22rem] lg:grid-cols-2"
    >
      <div className={`relative grid min-h-[280px] place-items-center bg-gradient-to-br ${tagTone(tag)} p-8`}>
        <div className="absolute inset-0 bg-black/8" />
        <div className="relative text-center">
          <span className="rounded-full bg-white/75 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-[color:var(--color-text-primary)]">
            Featured Post
          </span>
          <p className="mt-6 text-4xl font-semibold tracking-tight text-white">{tag}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-[color:var(--color-surface-card)] p-8 sm:p-10">
        <span className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
          Featured Post
        </span>
        <h3 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[color:var(--color-text-primary)] transition-colors group-hover:text-[color:var(--color-primary)] sm:text-[2.05rem]">
          {post.title}
        </h3>
        <p className="mt-4 text-base leading-8 text-[color:var(--color-text-secondary)]">
          {post.subtitle || 'A practical OrgSphere perspective for high-clarity teams.'}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="md" />
            <div>
              <p className="text-sm font-black text-[color:var(--color-text-primary)]">{authorName(post)}</p>
              <p className="text-xs text-[color:var(--color-text-tertiary)]">
                {formatDate(post.published_at)} · {post.reading_time} min read
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
