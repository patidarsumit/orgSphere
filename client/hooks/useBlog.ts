'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { BlogPaginatedResponse, BlogPost, PostStatus } from '@/types'

export interface BlogFilters {
  page?: number
  limit?: number
  tag?: string
  status?: PostStatus | ''
  search?: string
}

const cleanFilters = (filters: BlogFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )

export function usePublishedPosts(filters: BlogFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 9,
    tag: filters.tag || '',
    search: filters.search || '',
  }

  return useQuery<BlogPaginatedResponse>({
    queryKey: ['blog-posts', normalizedFilters],
    queryFn: async () => {
      const { data } = await api.get<BlogPaginatedResponse>('/posts/public', {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
  })
}

export function useInfinitePublishedPosts(filters: Omit<BlogFilters, 'page'> = {}) {
  const normalizedFilters = {
    limit: filters.limit ?? 9,
    tag: filters.tag || '',
    search: filters.search || '',
  }

  return useInfiniteQuery<BlogPaginatedResponse>({
    initialPageParam: 1,
    queryKey: ['blog-posts-infinite', normalizedFilters],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<BlogPaginatedResponse>('/posts/public', {
        params: cleanFilters({
          ...normalizedFilters,
          page: Number(pageParam),
        }),
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined
      }

      return lastPage.page + 1
    },
    staleTime: 60_000,
  })
}

export function useFeaturedPost() {
  return useQuery<BlogPost | null>({
    queryKey: ['blog-featured'],
    queryFn: async () => {
      const { data } = await api.get<BlogPost | null>('/posts/public/featured')
      return data
    },
    staleTime: 60_000,
  })
}

export function usePostBySlug(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ['blog-post', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data } = await api.get<BlogPost>(`/posts/public/${slug}`)
      return data
    },
    staleTime: 30_000,
  })
}

export function useBlogTags() {
  return useQuery<string[]>({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data } = await api.get<string[]>('/posts/public/tags')
      return data
    },
    staleTime: 300_000,
  })
}

export function useAllPostsAdmin(filters: BlogFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    status: filters.status || '',
    search: filters.search || '',
  } satisfies BlogFilters

  return useQuery<BlogPaginatedResponse>({
    queryKey: ['blog-posts-admin', normalizedFilters],
    queryFn: async () => {
      const { data } = await api.get<BlogPaginatedResponse>('/posts', {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function usePostByIdAdmin(id: string) {
  return useQuery<BlogPost>({
    queryKey: ['blog-post-admin', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<BlogPost>(`/posts/${id}`)
      return data
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<BlogPost>('/posts', input)
      return data
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-featured'] })
      queryClient.setQueryData(['blog-post-admin', post.id], post)
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put<BlogPost>(`/posts/${id}`, input)
      return data
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-featured'] })
      queryClient.setQueryData(['blog-post-admin', post.id], post)
    },
  })
}

export function usePublishPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<BlogPost>(`/posts/${id}/publish`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-featured'] })
    },
  })
}

export function useUnpublishPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<BlogPost>(`/posts/${id}/unpublish`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-featured'] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-featured'] })
      queryClient.removeQueries({ queryKey: ['blog-post-admin', id] })
    },
  })
}
