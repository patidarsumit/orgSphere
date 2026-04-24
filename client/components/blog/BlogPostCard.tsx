import Link from 'next/link'
import { Avatar } from '@/components/shared/Avatar'
import { BlogPost } from '@/types'
import { authorName, firstTag, formatDate, tagTone } from './blogUtils'

export function BlogPostCard({ post }: { post: BlogPost }) {
  const tag = firstTag(post)

  return (
    <article className="flex flex-col gap-4">
      <Link
        href={`/blog/${post.slug}`}
        className="group block overflow-hidden bg-[color:var(--color-surface-container)]"
      >
        <div className={`aspect-[16/9] bg-gradient-to-br ${tagTone(tag)} transition duration-500 group-hover:scale-[1.02]`} />
      </Link>
      <span className="w-fit bg-[color:var(--color-primary-light)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
        {tag}
      </span>
      <Link href={`/blog/${post.slug}`} className="group">
        <h3 className="line-clamp-2 text-[1.45rem] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--color-text-primary)] transition-colors group-hover:text-[color:var(--color-primary)]">
          {post.title}
        </h3>
      </Link>
      <p className="line-clamp-2 text-sm leading-7 text-[color:var(--color-text-secondary)]">
        {post.subtitle || 'Practical thinking for modern teams.'}
      </p>
      <div className="flex items-center justify-between gap-3 pt-2 text-xs text-[color:var(--color-text-tertiary)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="sm" />
          <span className="truncate font-medium text-[color:var(--color-text-secondary)]">
            {authorName(post)}
          </span>
        </div>
        <span className="shrink-0">{formatDate(post.published_at)}</span>
      </div>
    </article>
  )
}
