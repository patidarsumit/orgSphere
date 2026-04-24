'use client'

import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useBlogTags, useFeaturedPost, useInfinitePublishedPosts } from '@/hooks/useBlog'
import { BlogPostCard } from './BlogPostCard'
import { FeaturedPostCard } from './FeaturedPostCard'
import { formatDate } from './blogUtils'

interface BlogIndexClientProps {
  initialTag?: string
}

export function BlogIndexClient({ initialTag }: BlogIndexClientProps) {
  const [queryTag, setQueryTag] = useQueryState('tag', { defaultValue: initialTag ?? '' })
  const activeTag = initialTag ?? queryTag
  const posts = useInfinitePublishedPosts({ limit: 9, tag: activeTag })
  const featured = useFeaturedPost()
  const tags = useBlogTags()
  const tagList = tags.data ?? []
  const showFeatured = !activeTag && featured.data
  const articles = posts.data?.pages.flatMap((page) => page.data) ?? []
  const gridArticles = showFeatured
    ? articles.filter((post) => post.id !== featured.data?.id)
    : articles
  const recentPosts = showFeatured
    ? [featured.data!, ...gridArticles].slice(0, 5)
    : articles.slice(0, 5)

  const chooseTag = async (tag: string) => {
    await setQueryTag(tag)
  }

  return (
    <div className="space-y-0">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center border-b border-[color:var(--color-border)] pb-16 text-center">
        {initialTag ? (
          <Link href="/blog" className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-bold text-[color:var(--color-primary)]">
            <ArrowLeft size={16} /> All posts
          </Link>
        ) : null}
        <div className="inline-flex rounded-full bg-[color:var(--color-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          OrgSphere Blog
        </div>
        <h1 className="mx-auto mt-7 max-w-3xl text-5xl font-bold leading-tight text-[color:var(--color-text-primary)]">
          {initialTag ? `Posts tagged: ${initialTag}` : 'Insights for modern teams.'}
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] text-lg leading-8 text-[color:var(--color-text-secondary)]">
          Strategies, stories, and ideas on organizational design, collaboration, and workplace clarity.
        </p>
      </div>

      {!initialTag ? (
        <div className="flex items-center justify-center gap-5 overflow-x-auto border-b border-[color:var(--color-border)] py-6 text-center">
          <button
            type="button"
            onClick={() => void chooseTag('')}
            className={`shrink-0 text-xs font-black uppercase tracking-[0.24em] ${
              !activeTag
                ? 'text-[color:var(--color-primary)] underline decoration-2 underline-offset-[10px]'
                : 'text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-primary)]'
            }`}
          >
            All
          </button>
          {tagList.map((tag) => (
            <div key={tag} className="flex shrink-0 items-center gap-5">
              <span className="h-4 w-px bg-[color:var(--color-border)]" />
              <button
                type="button"
                onClick={() => void chooseTag(tag)}
                className={`text-xs font-black uppercase tracking-[0.24em] ${
                  activeTag === tag
                    ? 'text-[color:var(--color-primary)] underline decoration-2 underline-offset-[10px]'
                    : 'text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-primary)]'
                }`}
              >
                {tag}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-12 py-12 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="xl:border-r xl:border-[color:var(--color-border)] xl:pr-12">
          {showFeatured ? <FeaturedPostCard post={featured.data!} /> : null}

          {posts.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : gridArticles.length > 0 ? (
            <>
              <div className="grid gap-x-12 gap-y-16 md:grid-cols-2">
                {gridArticles.map((post, index) => (
                  <div key={post.id} className="contents">
                    <BlogPostCard post={post} />
                    {index % 2 === 1 && index !== gridArticles.length - 1 ? (
                      <div className="col-span-2 h-px bg-[color:var(--color-border)]" />
                    ) : null}
                  </div>
                ))}
                {gridArticles.length % 2 === 1 ? <div /> : null}
              </div>
              {posts.hasNextPage ? (
                <div className="mt-14 text-center">
                  <button
                    type="button"
                    onClick={() => void posts.fetchNextPage()}
                    disabled={posts.isFetchingNextPage}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-black text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
                  >
                    {posts.isFetchingNextPage ? 'Loading...' : 'More posts'} <ArrowRight size={16} />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-[color:var(--color-surface-card)] p-10 text-center">
              <h2 className="text-2xl font-semibold text-[color:var(--color-text-primary)]">
                No posts {activeTag ? `tagged "${activeTag}"` : 'yet'}
              </h2>
              <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
                Browse all posts or check back soon.
              </p>
              <Link
                href="/blog"
                className="mt-6 inline-flex rounded-full bg-[color:var(--color-primary)] px-5 py-2.5 text-sm font-black text-white"
              >
                Browse all posts
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-10">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--color-text-tertiary)]">
              Popular Tags
            </h2>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {tagList.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--color-primary)] transition hover:bg-[color:var(--color-on-primary-container)]"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--color-text-tertiary)]">
              Recent Posts
            </h2>
            <div className="mt-5 space-y-0 border-y border-[color:var(--color-border)]">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block border-b border-[color:var(--color-border)] py-4 last:border-b-0"
                >
                  <p className="text-sm font-bold leading-6 text-[color:var(--color-text-primary)] transition hover:text-[color:var(--color-primary)]">
                    {post.title}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
                    {formatDate(post.published_at, { month: 'short', day: 'numeric' })} · {post.reading_time} min read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
