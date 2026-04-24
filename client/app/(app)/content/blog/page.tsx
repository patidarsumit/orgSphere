'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { BlogManagement } from '@/components/blog/BlogManagement'
import { usePermissions } from '@/hooks/usePermissions'
import { RootState } from '@/store'

export default function BlogManagementPage() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const { can } = usePermissions()

  useEffect(() => {
    if (user && !can.accessBlog) {
      router.push('/dashboard')
    }
  }, [can.accessBlog, router, user])

  if (user && !can.accessBlog) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Content</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          Blog Workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Draft and review OrgSphere articles in a dedicated content area. Publishing stays limited
          to approved roles, while broader internal authors can contribute drafts.
        </p>
      </div>
      <BlogManagement />
    </div>
  )
}
