'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { SettingsOverview, User, UserRole } from '@/types'

export function useSettingsOverview() {
  return useQuery<SettingsOverview>({
    queryKey: ['settings', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<SettingsOverview>('/settings/overview')
      return data
    },
  })
}

export function useSettingsRoles() {
  return useQuery<User[]>({
    queryKey: ['settings', 'roles'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/settings/roles')
      return data
    },
  })
}

export function useUpdateSettingsRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      await api.put(`/settings/roles/${userId}`, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateProfileSettings() {
  return useMutation({
    mutationFn: async (input: { name: string; department: string | null }) => {
      const { data } = await api.put<User>('/settings/profile', input)
      return data
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { current_password: string; new_password: string }) => {
      await api.put('/settings/password', input)
    },
  })
}
