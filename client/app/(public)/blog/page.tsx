import { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogIndexClient } from '@/components/blog/BlogIndexClient'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicNav } from '@/components/public/PublicNav'

export const metadata: Metadata = {
  title: 'Blog | OrgSphere',
  description: 'Insights on org design, team performance, and the future of work.',
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <PublicNav />
      <section className="px-5 pb-20 pt-24">
        <div className="mx-auto max-w-[1200px]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-gray-100" />}>
            <BlogIndexClient />
          </Suspense>
        </div>
      </section>
      <PublicFooter />
    </main>
  )
}
