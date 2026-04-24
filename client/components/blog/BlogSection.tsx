'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useFeaturedPost, usePublishedPosts } from '@/hooks/useBlog'
import { BlogPostCard } from './BlogPostCard'
import { FeaturedPostCard } from './FeaturedPostCard'

export function BlogSection() {
  const featured = useFeaturedPost()
  const posts = usePublishedPosts({ limit: 4 })

  const featuredPost = featured.data
  const recentPosts = (posts.data?.data ?? [])
    .filter((post) => post.id !== featuredPost?.id)
    .slice(0, 3)

  if (featured.isLoading || posts.isLoading) {
    return (
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!featuredPost && recentPosts.length === 0) {
    return null
  }

  return (
    <section className="bg-white px-5 py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-600">
              From the blog
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
              Insights on org design and team performance
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Practical thinking on how modern companies work better.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center gap-2 text-sm font-black text-indigo-600"
          >
            View all posts <ArrowRight size={16} />
          </Link>
        </div>

        {featuredPost ? (
          <div className="mt-10">
            <FeaturedPostCard post={featuredPost} />
          </div>
        ) : null}

        {recentPosts.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {recentPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
