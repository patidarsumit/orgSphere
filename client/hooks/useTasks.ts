'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { PaginatedResponse, Task, TaskPriority, TaskStatus } from '@/types'

export interface TaskFilters {
  page?: number
  limit?: number
  status?: TaskStatus | ''
  priority?: TaskPriority | ''
  project_id?: string
}

const tasksKey = (filters: TaskFilters) => ['tasks', filters] as const
const projectTasksKey = (projectId: string, filters: TaskFilters) =>
  ['tasks', 'project', projectId, filters] as const

const cleanFilters = (filters: TaskFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )

export function useTasks(filters: TaskFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
    status: filters.status || ('' as const),
    priority: filters.priority || ('' as const),
    project_id: filters.project_id || '',
  } satisfies Required<TaskFilters>

  return useQuery<PaginatedResponse<Task>>({
    queryKey: tasksKey(normalizedFilters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Task>>('/tasks', {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function useProjectTasks(projectId: string, filters: TaskFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
    status: filters.status || ('' as const),
    priority: filters.priority || ('' as const),
    project_id: projectId,
  } satisfies Required<TaskFilters>

  return useQuery<PaginatedResponse<Task>>({
    queryKey: projectTasksKey(projectId, normalizedFilters),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Task>>(`/tasks/project/${projectId}`, {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function useTodayTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const { data } = await api.get<Task[]>('/tasks/today')
      return data
    },
    staleTime: 30_000,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<Task>('/tasks', input)
      return data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      if (task.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', task.project_id] })
      }
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put<Task>(`/tasks/${id}`, input)
      return data
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      if (task.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'project', task.project_id] })
      }
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
