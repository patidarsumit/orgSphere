'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { NotificationFeed } from '@/types/notifications'

export function useNotifications(page = 1, limit = 8) {
  return useQuery<NotificationFeed>({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      const { data } = await api.get<NotificationFeed>('/notifications', {
        params: { page, limit },
      })
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useNotificationUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count')
      return data
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
