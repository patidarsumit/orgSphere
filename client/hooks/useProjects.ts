'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AddProjectMemberInput,
  CreateProjectInput,
  ProjectStatus,
  UpdateProjectInput,
} from '@orgsphere/schemas'
import api from '@/lib/axios'
import { PaginatedResponse, Project, UserProject } from '@/types'

export interface ProjectFilters {
  page?: number
  limit?: number
  search?: string
  status?: ProjectStatus | ''
  tech?: string
  team_id?: string
  manager_id?: string
}

const projectsKey = (filters: ProjectFilters) => ['projects', filters] as const
const projectKey = (id: string) => ['project', id] as const
const userProjectsKey = (userId: string) => ['user-projects', userId] as const
const teamProjectsKey = (teamId: string) => ['team-projects', teamId] as const

const cleanFilters = (filters: ProjectFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )

export function useProjects(filters: ProjectFilters = {}) {
  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10,
    search: filters.search || '',
    status: filters.status || ('' as const),
    tech: filters.tech || '',
    team_id: filters.team_id || '',
    manager_id: filters.manager_id || '',
  } satisfies Required<ProjectFilters>

  return useQuery<PaginatedResponse<Project>>({
    queryKey: projectsKey(normalizedFilters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Project>>('/projects', {
        params: cleanFilters(normalizedFilters),
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: projectKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${id}`)
      return data
    },
  })
}

export function useRecentProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects-recent'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/projects/recent')
      return data
    },
    staleTime: 60_000,
  })
}

export function useUserProjects(userId: string) {
  return useQuery<UserProject[]>({
    queryKey: userProjectsKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get<UserProject[]>(`/projects/user/${userId}`)
      return data
    },
  })
}

export function useTeamProjects(teamId: string) {
  return useQuery<Project[]>({
    queryKey: teamProjectsKey(teamId),
    enabled: Boolean(teamId),
    queryFn: async () => {
      const { data } = await api.get<Project[]>(`/projects/team/${teamId}`)
      return data
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await api.post<Project>('/projects', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects-recent'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { data } = await api.put<Project>(`/projects/${id}`, input)
      return data
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.setQueryData(projectKey(id), project)
      queryClient.invalidateQueries({ queryKey: ['projects-recent'] })
      if (project.team_id) {
        queryClient.invalidateQueries({ queryKey: teamProjectsKey(project.team_id) })
      }
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects-recent'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddProjectMemberInput) => {
      const { data } = await api.post<Project>(`/projects/${projectId}/members`, input)
      return data
    },
    onSuccess: (project) => {
      queryClient.setQueryData(projectKey(projectId), project)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      project.project_members.forEach((member) => {
        queryClient.invalidateQueries({ queryKey: userProjectsKey(member.user_id) })
      })
    },
  })
}

export function useUpdateProjectMemberRole(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.put<Project>(`/projects/${projectId}/members/${userId}`, { role })
      return data
    },
    onSuccess: (project) => {
      queryClient.setQueryData(projectKey(projectId), project)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      return userId
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: projectKey(projectId) })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: userProjectsKey(userId) })
    },
  })
}
