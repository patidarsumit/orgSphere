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
    <div className="space-y-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {initialTag ? (
          <Link href="/blog" className="mb-5 inline-flex w-fit items-center gap-2 text-sm font-bold text-indigo-600">
            <ArrowLeft size={16} /> All articles
          </Link>
        ) : null}
        <div className="inline-flex rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
          OrgSphere Blog
        </div>
        <h1 className="mx-auto mt-7 max-w-3xl text-5xl font-bold leading-tight tracking-tight text-gray-900">
          {initialTag ? `Articles tagged: ${initialTag}` : 'Insights for modern teams.'}
        </h1>
        <p className="mx-auto mt-6 max-w-[620px] text-lg leading-8 text-gray-500">
          Strategies, stories, and ideas on organizational design, collaboration, and workplace clarity.
        </p>
      </div>

      {!initialTag ? (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void chooseTag('')}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${!activeTag ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-100 hover:bg-indigo-50'}`}
          >
            All
          </button>
          {tagList.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => void chooseTag(tag)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTag === tag ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-100 hover:bg-indigo-50'}`}
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
