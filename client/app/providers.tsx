'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <NuqsAdapter>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    </NuqsAdapter>
  )
}
