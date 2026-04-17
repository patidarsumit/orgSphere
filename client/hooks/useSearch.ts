'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { SearchResponse } from '@/types'

export function useSearch(query: string) {
  const normalizedQuery = query.trim()

  return useQuery<SearchResponse>({
    queryKey: ['search', normalizedQuery],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>('/search', {
        params: { q: normalizedQuery },
      })
      return data
    },
    enabled: normalizedQuery.length >= 2,
    staleTime: 10_000,
    gcTime: 30_000,
  })
}
