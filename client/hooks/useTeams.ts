'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreateTeamInput, UpdateTeamInput } from '@orgsphere/schemas'
import api from '@/lib/axios'
import { PaginatedResponse, Team } from '@/types'

export interface TeamFilters {
  page?: number
  limit?: number
  search?: string
}

const teamsKey = (filters: TeamFilters) => ['teams', filters] as const
const teamKey = (id: string) => ['teams', id] as const
const userTeamsKey = (userId: string) => ['teams', 'user', userId] as const

const normalizeFilters = (filters: TeamFilters): Required<TeamFilters> => ({
  page: filters.page ?? 1,
  limit: filters.limit ?? 12,
  search: filters.search || '',
})

export function useTeams(filters: TeamFilters = {}) {
  const normalizedFilters = normalizeFilters(filters)

  return useQuery<PaginatedResponse<Team>>({
    queryKey: teamsKey(normalizedFilters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Team>>('/teams', {
        params: {
          ...normalizedFilters,
          search: normalizedFilters.search || undefined,
        },
      })
      return data
    },
    staleTime: 30_000,
  })
}

export function useTeam(id: string) {
  return useQuery<Team>({
    queryKey: teamKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Team>(`/teams/${id}`)
      return data
    },
  })
}

export function useUserTeams(userId: string) {
  return useQuery<Team[]>({
    queryKey: userTeamsKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get<Team[]>(`/teams/user/${userId}`)
      return data
    },
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      const { data } = await api.post<Team>('/teams', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateTeam(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTeamInput) => {
      const { data } = await api.put<Team>(`/teams/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: teamKey(id) })
    },
  })
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<Team>(`/teams/${teamId}/members`, { user_id: userId })
      return data
    },
    onSuccess: (team) => {
      queryClient.setQueryData(teamKey(teamId), team)
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      team.members.forEach((member) => {
        queryClient.invalidateQueries({ queryKey: userTeamsKey(member.id) })
      })
    },
  })
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      return userId
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: teamKey(teamId) })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: userTeamsKey(userId) })
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teams/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
