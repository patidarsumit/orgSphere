'use client'

import Link from 'next/link'
import { parseAsInteger, useQueryState } from 'nuqs'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useBlogTags, useFeaturedPost, usePublishedPosts } from '@/hooks/useBlog'
import { BlogPostCard } from './BlogPostCard'
import { FeaturedPostCard } from './FeaturedPostCard'

interface BlogIndexClientProps {
  initialTag?: string
}

export function BlogIndexClient({ initialTag }: BlogIndexClientProps) {
  const [queryTag, setQueryTag] = useQueryState('tag', { defaultValue: initialTag ?? '' })
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const activeTag = initialTag ?? queryTag
  const posts = usePublishedPosts({ page, limit: 9, tag: activeTag })
  const featured = useFeaturedPost()
  const tags = useBlogTags()

  const articles = posts.data?.data ?? []
  const tagList = tags.data ?? []
  const showFeatured = !activeTag && featured.data

  const chooseTag = async (tag: string) => {
    await setPage(1)
    await setQueryTag(tag)
  }

  return (
    <div className="space-y-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center">
        {initialTag ? (
          <Link href="/blog" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600">
            <ArrowLeft size={16} /> All articles
          </Link>
        ) : null}
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">OrgSphere Blog</p>
        <h1 className="text-4xl font-black tracking-tight text-gray-950">
          {initialTag ? `Articles tagged: ${initialTag}` : 'OrgSphere Blog'}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-gray-500">
          Insights on organizational design, team performance, and the future of work.
        </p>
      </div>

      {!initialTag ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void chooseTag('')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${!activeTag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50'}`}
          >
            All
          </button>
          {tagList.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => void chooseTag(tag)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {showFeatured ? <FeaturedPostCard post={featured.data!} /> : null}

      <div className="grid gap-8 xl:grid-cols-[1fr_280px]">
        <section>
          {posts.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
              {posts.data && page < posts.data.totalPages ? (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => void setPage(page + 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-5 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-50"
                  >
                    Load more articles <ArrowRight size={16} />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-[var(--shadow-card)] ring-1 ring-gray-100">
              <h2 className="text-2xl font-black text-gray-950">
                No articles {activeTag ? `tagged "${activeTag}"` : 'yet'}
              </h2>
              <p className="mt-3 text-sm text-gray-500">Browse all articles or check back soon.</p>
              <Link
                href="/blog"
                className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white"
              >
                Browse all articles
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-gray-100">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-400">Popular Tags</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-gray-100">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-400">Recent Posts</h2>
            <div className="mt-4 space-y-3">
              {articles.slice(0, 5).map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block text-sm font-bold leading-6 text-gray-700 hover:text-indigo-600">
                  {post.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
