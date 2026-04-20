import { Metadata } from 'next'
import { BlogArticleClient } from '@/components/blog/BlogArticleClient'
import { PublicNav } from '@/components/public/PublicNav'
import { BlogPost } from '@/types'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/public/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) {
    return {
      title: 'Article not found | OrgSphere Blog',
    }
  }

  return {
    title: `${post.title} | OrgSphere Blog`,
    description: post.subtitle ?? post.title,
    openGraph: {
      title: post.title,
      description: post.subtitle ?? '',
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      authors: [post.author?.name ?? 'OrgSphere'],
    },
  }
}

export default async function BlogArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <PublicNav />
      <section className="px-5 py-14">
        <BlogArticleClient slug={slug} />
      </section>
    </main>
  )
}
