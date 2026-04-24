'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BookOpen, Eye, Pencil, Plus, Send, Trash2, Undo2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { usePermissions } from '@/hooks/usePermissions'
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

function BlogTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-3 shadow-sm">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="mb-2 grid grid-cols-12 gap-4 rounded-xl bg-[color:var(--color-surface-low)] p-4"
        >
          <div className="col-span-4 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
          <div className="col-span-2 h-5 animate-pulse rounded bg-[color:var(--color-surface-card)]" />
        </div>
      ))}
    </div>
  )
}

export function BlogManagement() {
  const { can, isAdmin, user } = usePermissions()
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

  const canManagePost = (post: BlogPost) => Boolean(isAdmin || post.author?.id === user?.id)

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
      <section className="rounded-2xl bg-[color:var(--color-surface-card)] p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[color:var(--color-primary)]">
              Publishing
            </p>
            <h2 className="mt-1 text-xl font-black text-[color:var(--color-text-primary)]">
              Blog Management
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
              Draft, review, and publish public OrgSphere articles. Authors can manage their own
              posts, while approved roles control publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditor()}
            className="primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_-16px_rgba(53,37,205,0.8)]"
          >
            <Plus size={16} /> New Post
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl bg-[color:var(--color-surface-low)] p-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition-colors ${
                status === filter.value
                  ? 'bg-[color:var(--color-surface-card)] text-[color:var(--color-primary)] shadow-sm'
                  : 'text-[color:var(--color-text-tertiary)] hover:bg-white/70'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-[color:var(--color-surface-card)] p-3 shadow-sm">
        {posts.isLoading ? (
          <BlogTableSkeleton />
        ) : posts.data?.data.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[color:var(--color-text-tertiary)]">
                <tr>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Tags</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.data.data.map((post) => (
                  <tr
                    key={post.id}
                    className="h-[52px] rounded-xl bg-[color:var(--color-surface-low)] transition-colors hover:bg-[color:var(--color-surface-high)]"
                  >
                    <td className="max-w-[320px] rounded-l-xl px-5 py-4">
                      {canManagePost(post) ? (
                        <button
                          type="button"
                          onClick={() => openEditor(post)}
                          className="line-clamp-1 text-left font-black text-[color:var(--color-text-primary)] hover:text-[color:var(--color-primary)]"
                        >
                          {post.title}
                        </button>
                      ) : (
                        <p className="line-clamp-1 font-black text-[color:var(--color-text-primary)]">
                          {post.title}
                        </p>
                      )}
                      <span className="block max-w-[260px] truncate text-xs text-[color:var(--color-text-tertiary)]">
                        {post.subtitle || 'Public article for the OrgSphere editorial stream.'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass[post.status ?? 'draft']}`}>
                        {post.status ?? 'draft'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={post.author?.name ?? 'OrgSphere'} avatarPath={post.author?.avatar_path} size="sm" />
                        <span className="font-semibold text-[color:var(--color-text-secondary)]">
                          {post.author?.name ?? 'OrgSphere'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-[color:var(--color-text-tertiary)]">
                        <Eye size={14} /> {post.views}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[color:var(--color-text-tertiary)]">
                      {post.published_at ? formatDate(post.published_at) : '-'}
                    </td>
                    <td className="rounded-r-xl px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {post.status === 'published' ? (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            aria-label={`View ${post.title}`}
                            title="View post"
                            className="rounded-lg p-2 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-card)]"
                          >
                            <Eye size={16} />
                          </Link>
                        ) : null}
                        {canManagePost(post) ? (
                          <button
                            type="button"
                            onClick={() => openEditor(post)}
                            aria-label={`Edit ${post.title}`}
                            title="Edit post"
                            className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-card)]"
                          >
                            <Pencil size={16} />
                          </button>
                        ) : null}
                        {can.publishBlog ? (
                          <button
                            type="button"
                            onClick={() => void togglePublish(post)}
                            aria-label={
                              post.status === 'published'
                                ? `Unpublish ${post.title}`
                                : `Publish ${post.title}`
                            }
                            title={post.status === 'published' ? 'Unpublish post' : 'Publish post'}
                            className="rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-card)]"
                          >
                            {post.status === 'published' ? <Undo2 size={16} /> : <Send size={16} />}
                          </button>
                        ) : null}
                        {canManagePost(post) ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(post)}
                            aria-label={`Delete ${post.title}`}
                            title="Delete post"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
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
