'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, CreatePostInput } from '@orgsphere/schemas'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { TiptapEditor } from '@/components/notes/TiptapEditor'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import {
  useBlogTags,
  useCreatePost,
  usePostByIdAdmin,
  usePublishPost,
  useUpdatePost,
} from '@/hooks/useBlog'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { RootState } from '@/store'
import { PostStatus } from '@/types'

const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

interface PostEditorModalProps {
  open: boolean
  onClose: () => void
  postId?: string
}

type SaveStatus = 'idle' | 'saving' | 'saved'

const estimateReadingTime = (content: Record<string, unknown>) => {
  const extract = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const typed = node as { type?: string; text?: string; content?: unknown[] }
    if (typed.type === 'text') return typed.text ?? ''
    if (Array.isArray(typed.content)) return typed.content.map(extract).join(' ')
    return ''
  }
  const words = extract(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function PostEditorModal({ open, onClose, postId }: PostEditorModalProps) {
  const [currentPostId, setCurrentPostId] = useState(postId ?? '')
  const [content, setContent] = useState<Record<string, unknown>>(emptyDoc)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const post = usePostByIdAdmin(currentPostId)
  const existingTags = useBlogTags()
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const publishPost = usePublishPost()

  const {
    register,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      content: emptyDoc,
      cover_image_url: null,
      tags: [],
      status: 'draft',
      reading_time: 1,
    },
  })

  const title = watch('title')
  const subtitle = watch('subtitle')
  const coverImageUrl = watch('cover_image_url')
  const status = watch('status') as PostStatus
  const readingTime = useMemo(() => estimateReadingTime(content), [content])
  const slugPreview = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  useEffect(() => {
    setCurrentPostId(postId ?? '')
  }, [postId])

  useEffect(() => {
    if (!open) return
    if (post.data) {
      reset({
        title: post.data.title,
        subtitle: post.data.subtitle ?? '',
        content: post.data.content ?? emptyDoc,
        cover_image_url: post.data.cover_image_url,
        tags: post.data.tags,
        status: post.data.status ?? 'draft',
        reading_time: post.data.reading_time,
      })
      setContent(post.data.content ?? emptyDoc)
      setTags(post.data.tags)
      setDirty(false)
      setSaveStatus('idle')
    } else if (!currentPostId) {
      reset({
        title: '',
        subtitle: '',
        content: emptyDoc,
        cover_image_url: null,
        tags: [],
        status: 'draft',
        reading_time: 1,
      })
      setContent(emptyDoc)
      setTags([])
      setDirty(false)
      setSaveStatus('idle')
    }
  }, [currentPostId, open, post.data, reset])

  useEffect(() => {
    setValue('content', content)
    setValue('tags', tags)
    setValue('reading_time', readingTime)
  }, [content, readingTime, setValue, tags])

  const buildPayload = (nextStatus?: PostStatus) => ({
    ...getValues(),
    title: getValues().title.trim(),
    subtitle: getValues().subtitle || null,
    cover_image_url: getValues().cover_image_url || null,
    content,
    tags,
    status: nextStatus ?? getValues().status,
    reading_time: readingTime,
  })

  const saveDraft = async (silent = false) => {
    const payload = buildPayload('draft')
    if (payload.title.length < 3) {
      if (!silent) appToast.warning('Add a title with at least 3 characters')
      return null
    }

    try {
      setSaveStatus('saving')
      const saved = currentPostId
        ? await updatePost.mutateAsync({ id: currentPostId, ...payload })
        : await createPost.mutateAsync(payload)
      setCurrentPostId(saved.id)
      setDirty(false)
      setSaveStatus('saved')
      if (!silent) appToast.success('Draft saved')
      return saved
    } catch (error) {
      setSaveStatus('idle')
      if (!silent) appToast.error(getToastErrorMessage(error, 'Unable to save draft'))
      return null
    }
  }

  useEffect(() => {
    if (!open || !dirty || title.trim().length < 3) return

    const timeout = window.setTimeout(() => {
      void saveDraft(true)
    }, 2000)

    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, dirty, open, subtitle, tags, title, coverImageUrl])

  const publish = async () => {
    const saved = currentPostId ? await saveDraft(true) : await saveDraft()
    const targetId = saved?.id ?? currentPostId
    if (!targetId) return

    try {
      await publishPost.mutateAsync(targetId)
      setValue('status', 'published')
      setDirty(false)
      appToast.success('Post published')
    } catch (error) {
      appToast.error(getToastErrorMessage(error, 'Unable to publish post'))
    }
  }

  const addTag = (tag: string) => {
    const next = tag.trim()
    if (!next || tags.includes(next)) return
    setTags([...tags, next])
    setDirty(true)
    setTagInput('')
  }

  const requestClose = () => {
    if (dirty) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-white text-gray-950">
      <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex min-h-0 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-5">
            <button type="button" onClick={requestClose} className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-950">
              <ArrowLeft size={16} /> Back
            </button>
            <p className="hidden truncate text-sm font-black text-gray-500 sm:block">
              {currentPostId ? `Editing: ${title || 'Untitled post'}` : 'New Post'}
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-bold text-gray-400 sm:inline">
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Draft saved' : ''}
              </span>
              <button
                type="button"
                onClick={() => void saveDraft()}
                className="rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => void publish()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Publish
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-5 py-8">
              <input
                {...register('title')}
                onChange={(event) => {
                  register('title').onChange(event)
                  setDirty(true)
                }}
                placeholder="Post title..."
                className="w-full bg-transparent text-4xl font-black tracking-tight text-gray-950 outline-none placeholder:text-gray-300"
              />
              {errors.title ? <p className="mt-2 text-sm text-red-600">{errors.title.message}</p> : null}
              <input
                {...register('subtitle')}
                onChange={(event) => {
                  register('subtitle').onChange(event)
                  setDirty(true)
                }}
                placeholder="Add a subtitle..."
                className="mt-4 w-full bg-transparent text-xl leading-8 text-gray-500 outline-none placeholder:text-gray-300"
              />
              <div className="my-8 h-px bg-gray-100" />
              <TiptapEditor
                content={content}
                onChange={(nextContent) => {
                  setContent(nextContent)
                  setDirty(true)
                }}
                placeholder="Tell your story..."
              />
            </div>
          </div>
        </section>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-gray-100 bg-gray-50/70 lg:block">
          <div className="sticky top-0 border-b border-gray-100 bg-white px-5 py-4">
            <p className="text-sm font-black text-gray-600">Post settings</p>
          </div>
          <div className="space-y-6 p-5">
            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Status</h3>
              <span className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                {status}
              </span>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Cover Image</h3>
              <input
                {...register('cover_image_url')}
                onChange={(event) => {
                  register('cover_image_url').onChange(event)
                  setDirty(true)
                }}
                placeholder="Cover image URL"
                className="mt-2 h-10 w-full rounded-lg bg-white px-3 text-sm outline-none ring-1 ring-gray-100"
              />
              {coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImageUrl} alt="" className="mt-3 aspect-video w-full rounded-lg object-cover" />
              ) : null}
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Tags</h3>
              <div className="mt-2 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addTag(tagInput)
                    }
                  }}
                  placeholder="Type and press Enter"
                  className="h-10 min-w-0 flex-1 rounded-lg bg-white px-3 text-sm outline-none ring-1 ring-gray-100"
                />
                <button type="button" onClick={() => addTag(tagInput)} className="rounded-lg bg-indigo-600 px-3 text-white">
                  <Plus size={16} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setTags(tags.filter((item) => item !== tag))
                      setDirty(true)
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600"
                  >
                    {tag} <X size={12} />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(existingTags.data ?? []).slice(0, 8).map((tag) => (
                  <button key={tag} type="button" onClick={() => addTag(tag)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-500">
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Reading time</h3>
              <p className="mt-2 text-sm font-black text-gray-900">{readingTime} min read</p>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Author</h3>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-gray-100">
                <Avatar name={currentUser?.name ?? 'OrgSphere User'} avatarPath={currentUser?.avatar_path} size="md" />
                <div>
                  <p className="text-sm font-black text-gray-900">{currentUser?.name ?? 'Current user'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.role ?? 'admin'}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">SEO Preview</h3>
              <div className="mt-3 rounded-xl bg-white p-4 ring-1 ring-gray-100">
                <p className="line-clamp-1 text-sm font-black text-blue-700">{title || 'Post title'}</p>
                <p className="mt-1 text-xs text-green-700">orgsphere.local/blog/{slugPreview || 'post-slug'}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-500">{subtitle || 'Subtitle or first article excerpt appears here.'}</p>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="You have unsaved changes"
        description="Leave without saving this post?"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false)
          onClose()
        }}
      />
    </div>
  )
}
