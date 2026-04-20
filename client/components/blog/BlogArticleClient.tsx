'use client'

import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Avatar } from '@/components/shared/Avatar'
import { usePostBySlug, usePublishedPosts } from '@/hooks/useBlog'
import { RootState } from '@/store'
import { BlogContentRenderer } from './BlogContentRenderer'
import { BlogPostCard } from './BlogPostCard'
import { authorName, firstTag, formatDate } from './blogUtils'

export function BlogArticleClient({ slug }: { slug: string }) {
  const { data: post, isLoading, isError } = usePostBySlug(slug)
  const user = useSelector((state: RootState) => state.auth.user)
  const related = usePublishedPosts({
    tag: post?.tags[0] ?? '',
    limit: 4,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[680px] space-y-6">
        <div className="h-8 w-36 animate-pulse rounded bg-gray-100" />
        <div className="h-20 animate-pulse rounded bg-gray-100" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-100" />
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-[680px] rounded-2xl bg-white p-10 text-center shadow-[var(--shadow-card)] ring-1 ring-gray-100">
        <h1 className="text-3xl font-black text-gray-950">Article not found</h1>
        <p className="mt-3 text-gray-500">The article may have been unpublished or moved.</p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white"
        >
          <ArrowLeft size={16} /> Back to blog
        </Link>
      </div>
    )
  }

  const relatedPosts = (related.data?.data ?? []).filter((item) => item.id !== post.id).slice(0, 3)

  return (
    <article className="mx-auto max-w-[680px]">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-indigo-600">
        <ArrowLeft size={16} /> Back to blog
      </Link>

      <div className="mt-8 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-indigo-600"
          >
            {tag}
          </Link>
        ))}
      </div>

      <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.02em] text-gray-950 sm:text-5xl">
        {post.title}
      </h1>
      {post.subtitle ? (
        <p className="mt-4 text-xl leading-8 text-gray-600">{post.subtitle}</p>
      ) : null}

      <div className="mt-7 flex items-center gap-4 border-y border-gray-100 py-4">
        <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-gray-900">{authorName(post)}</p>
          <p className="text-sm text-gray-500">
            {post.author?.role ?? 'editor'} · Published {formatDate(post.published_at, { month: 'long' })}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            {post.reading_time} min read · <Eye size={14} /> {post.views} views
          </p>
        </div>
      </div>

      <div className="mt-8 aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-center">
            <span className="rounded-full bg-white/70 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
              {firstTag(post)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-10">
        <BlogContentRenderer content={post.content ?? {}} />
      </div>

      <footer className="mt-12 border-t border-gray-100 pt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-gray-500">Tagged in:</span>
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog/tag/${encodeURIComponent(tag)}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {tag}
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-gray-100">
          <div className="flex items-start gap-4">
            <Avatar name={authorName(post)} avatarPath={post.author?.avatar_path} size="xl" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-400">Written by</p>
              <h2 className="mt-1 text-lg font-black text-gray-950">{authorName(post)}</h2>
              <p className="text-sm text-gray-500">{post.author?.role ?? 'OrgSphere editor'}</p>
              {post.author?.department ? (
                <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
                  {post.author.department}
                </span>
              ) : null}
              {user && post.author?.id ? (
                <Link
                  href={`/employees/${post.author.id}`}
                  className="mt-4 block text-sm font-black text-indigo-600"
                >
                  View profile
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </footer>

      {relatedPosts.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-black text-gray-950">More articles</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((item) => (
              <BlogPostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
