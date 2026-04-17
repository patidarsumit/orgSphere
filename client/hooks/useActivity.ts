'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { ActivityFeed, ActivityItem } from '@/types'

export function useActivityFeed(page = 1, limit = 20, actorId?: string, enabled = true) {
  return useQuery<ActivityFeed>({
    queryKey: ['activity-feed', page, limit, actorId || ''],
    queryFn: async () => {
      const { data } = await api.get<ActivityFeed>('/activity', {
        params: { page, limit, actor_id: actorId || undefined },
      })
      return data
    },
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useRecentActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ['activity-recent'],
    queryFn: async () => {
      const { data } = await api.get<ActivityItem[]>('/activity/recent')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useEntityActivity(entityType: string, entityId: string) {
  return useQuery<ActivityItem[]>({
    queryKey: ['activity-entity', entityType, entityId],
    enabled: Boolean(entityType && entityId),
    queryFn: async () => {
      const { data } = await api.get<ActivityItem[]>(`/activity/${entityType}/${entityId}`)
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['activity-unread'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/activity/unread-count')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/activity/mark-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-unread'] })
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] })
      queryClient.invalidateQueries({ queryKey: ['activity-recent'] })
    },
  })
}
