'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Note, PaginatedResponse } from '@/types'

export interface NoteFilters {
  page?: number
  limit?: number
  search?: string
  tag?: string
  project_id?: string
}

const notesKey = (filters: NoteFilters) => ['notes', filters] as const
const noteKey = (id: string) => ['note', id] as const

const cleanFilters = (filters: NoteFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )

export function useNotes(filters: NoteFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    search: filters.search || '',
    tag: filters.tag || '',
    project_id: filters.project_id || '',
  } satisfies Required<NoteFilters>

  return useQuery<PaginatedResponse<Note>>({
    queryKey: notesKey(normalizedFilters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Note>>('/notes', {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function useNote(id: string) {
  return useQuery<Note>({
    queryKey: noteKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Note>(`/notes/${id}`)
      return data
    },
  })
}

export function useRecentNotes() {
  return useQuery<Note[]>({
    queryKey: ['notes', 'recent'],
    queryFn: async () => {
      const { data } = await api.get<Note[]>('/notes/recent')
      return data
    },
    staleTime: 30_000,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<Note>('/notes', input)
      return data
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.setQueryData(noteKey(note.id), note)
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put<Note>(`/notes/${id}`, input)
      return data
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.setQueryData(noteKey(note.id), note)
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.removeQueries({ queryKey: noteKey(id) })
    },
  })
}
