'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CreateEmployeeInput,
  EmployeeQuery,
  UpdateEmployeeInput,
} from '@orgsphere/schemas'
import api from '@/lib/axios'
import { Employee, PaginatedResponse, UserRole } from '@/types'

export interface EmployeeFilters {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  skill?: string
  department?: string
  is_active?: boolean
}

export interface AvatarUploadResponse {
  avatar_path: string
  url: string
}

const employeesKey = (filters: EmployeeFilters) => ['employees', filters] as const
const employeeKey = (id: string) => ['employees', id] as const

const normalizeFilters = (filters: EmployeeFilters): EmployeeQuery => ({
  page: filters.page ?? 1,
  limit: filters.limit ?? 12,
  search: filters.search || undefined,
  role: filters.role,
  skill: filters.skill || undefined,
  department: filters.department || undefined,
  is_active: filters.is_active,
})

export function useEmployees(filters: EmployeeFilters) {
  const normalizedFilters = normalizeFilters(filters)

  return useQuery<PaginatedResponse<Employee>>({
    queryKey: employeesKey(normalizedFilters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Employee>>('/employees', {
        params: normalizedFilters,
      })
      return data
    },
  })
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: employeeKey(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Employee>(`/employees/${id}`)
      return data
    },
  })
}

export function useEmployeeSkills() {
  return useQuery<string[]>({
    queryKey: ['employees', 'skills'],
    queryFn: async () => {
      const { data } = await api.get<string[]>('/employees/skills')
      return data
    },
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data } = await api.post<Employee>('/employees', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateEmployeeInput) => {
      const { data } = await api.put<Employee>(`/employees/${id}`, input)
      return data
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.setQueryData(employeeKey(id), employee)
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUploadEmployeeAvatar(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.post<AvatarUploadResponse>(
        `/employees/${id}/avatar`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: employeeKey(id) })
    },
  })
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
