'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import {
  DashboardInsights,
  MyTaskInsights,
  ProjectDetailInsights,
  ProjectHealthSignal,
  ProjectsHealth,
  ProjectsInsights,
} from '@/types/insights'

export function useDashboardInsights() {
  return useQuery<DashboardInsights>({
    queryKey: ['dashboard-insights'],
    queryFn: async () => {
      const { data } = await api.get<DashboardInsights>('/dashboard/insights')
      return data
    },
    staleTime: 30_000,
  })
}

export function useProjectsInsights() {
  return useQuery<ProjectsInsights>({
    queryKey: ['projects-insights'],
    queryFn: async () => {
      const { data } = await api.get<ProjectsInsights>('/projects/insights')
      return data
    },
    staleTime: 30_000,
  })
}

export function useProjectDetailInsights(projectId: string) {
  return useQuery<ProjectDetailInsights>({
    queryKey: ['project-insights', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await api.get<ProjectDetailInsights>(`/projects/${projectId}/insights`)
      return data
    },
    staleTime: 30_000,
  })
}

export function useProjectsHealth() {
  return useQuery<ProjectsHealth>({
    queryKey: ['projects-health'],
    queryFn: async () => {
      const { data } = await api.get<ProjectsHealth>('/projects/health')
      return data
    },
    staleTime: 30_000,
  })
}

export function useProjectHealth(projectId: string) {
  return useQuery<ProjectHealthSignal>({
    queryKey: ['project-health', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await api.get<ProjectHealthSignal>(`/projects/${projectId}/health`)
      return data
    },
    staleTime: 30_000,
  })
}

export function useMyTaskInsights() {
  return useQuery<MyTaskInsights>({
    queryKey: ['tasks', 'my-insights'],
    queryFn: async () => {
      const { data } = await api.get<MyTaskInsights>('/tasks/my/insights')
      return data
    },
    staleTime: 30_000,
  })
}
