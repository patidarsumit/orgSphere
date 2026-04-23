import { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogIndexClient } from '@/components/blog/BlogIndexClient'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicNav } from '@/components/public/PublicNav'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  return {
    title: `${decodedTag} | OrgSphere Blog`,
    description: `Articles about ${decodedTag} from the OrgSphere blog.`,
  }
}

export default async function BlogTagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <PublicNav />
      <section className="px-5 pb-20 pt-24">
        <div className="mx-auto max-w-[1200px]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-gray-100" />}>
            <BlogIndexClient initialTag={decodedTag} />
          </Suspense>
        </div>
      </section>
      <PublicFooter />
    </main>
  )
}
