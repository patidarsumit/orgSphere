import { Metadata } from 'next'
import { Suspense } from 'react'
import { BlogIndexClient } from '@/components/blog/BlogIndexClient'
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
    <main className="min-h-screen bg-white text-gray-950">
      <PublicNav />
      <section className="px-5 py-14">
        <div className="mx-auto max-w-[1200px]">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-gray-100" />}>
            <BlogIndexClient initialTag={decodedTag} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
