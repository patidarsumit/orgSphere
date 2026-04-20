'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BookOpen, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useAllPostsAdmin,
  useDeletePost,
  usePublishPost,
  useUnpublishPost,
} from '@/hooks/useBlog'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { BlogPost, PostStatus } from '@/types'
import { formatDate } from './blogUtils'
import { PostEditorModal } from './PostEditorModal'

const filters: Array<{ label: string; value: PostStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Archived', value: 'archived' },
]

const statusClass: Record<PostStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-amber-50 text-amber-700',
  archived: 'bg-gray-100 text-gray-600',
}

export function BlogManagement() {
  const [status, setStatus] = useState<PostStatus | ''>('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const posts = useAllPostsAdmin({ status })
  const publishPost = usePublishPost()
  const unpublishPost = useUnpublishPost()
  const deletePost = useDeletePost()

  const openEditor = (post?: BlogPost) => {
    setEditingId(post?.id ?? '')
    setEditorOpen(true)
  }

  const togglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'published') {
        await unpublishPost.mutateAsync(post.id)
        appToast.success('Post unpublished')
      } else {
        await publishPost.mutateAsync(post.id)
        appToast.success('Post published')
      }
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to update post status'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePost.mutateAsync(deleteTarget.id)
      appToast.success('Post deleted')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to delete post'))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-indigo-500">Publishing</p>
            <h2 className="mt-1 text-xl font-black text-gray-950">Blog Management</h2>
            <p className="mt-1 text-sm text-gray-500">Write, edit, publish, and archive public OrgSphere articles.</p>
          </div>
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-4 py-2 text-sm font-black ${
                status === filter.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-[var(--shadow-card)] ring-1 ring-gray-100">
        {posts.isLoading ? (
          <div className="h-80 animate-pulse bg-gray-100" />
        ) : posts.data?.data.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Published</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.data.data.map((post) => (
                  <tr key={post.id} className="align-middle">
                    <td className="max-w-[320px] px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openEditor(post)}
                        className="line-clamp-1 text-left font-black text-gray-900 hover:text-indigo-600"
                      >
                        {post.title}
                      </button>
                    </td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass[post.status ?? 'draft']}`}>
                        {post.status ?? 'draft'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={post.author?.name ?? 'OrgSphere'} avatarPath={post.author?.avatar_path} size="sm" />
                        <span className="font-semibold text-gray-700">{post.author?.name ?? 'OrgSphere'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Eye size={14} /> {post.views}
                      </span>
                    </td>
                    <td className="text-gray-500">{post.published_at ? formatDate(post.published_at) : '-'}</td>
                    <td className="pr-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {post.status === 'published' ? (
                          <Link href={`/blog/${post.slug}`} target="_blank" className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                            View
                          </Link>
                        ) : null}
                        <button type="button" onClick={() => openEditor(post)} className="rounded-lg px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50">
                          Edit
                        </button>
                        <button type="button" onClick={() => void togglePublish(post)} className="rounded-lg px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50">
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(post)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 size={15} />
                        </button>
                        <MoreHorizontal size={16} className="text-gray-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid place-items-center p-12 text-center">
            <BookOpen className="h-10 w-10 text-indigo-300" />
            <h3 className="mt-4 text-xl font-black text-gray-950">No blog posts yet</h3>
            <p className="mt-2 text-sm text-gray-500">Write your first public OrgSphere article.</p>
            <button
              type="button"
              onClick={() => openEditor()}
              className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black text-white"
            >
              Write your first post
            </button>
          </div>
        )}
      </section>

      <PostEditorModal
        open={editorOpen}
        postId={editingId || undefined}
        onClose={() => {
          setEditorOpen(false)
          setEditingId('')
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete blog post"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        dangerous
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
