'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import api from '@/lib/axios'
import { DocumentTitle } from '@/components/layout/DocumentTitle'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { LoadingBar } from '@/components/shared/LoadingBar'
import { RootState } from '@/store'
import { setCredentials, setLoading } from '@/store/slices/authSlice'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        dispatch(setCredentials(data))
      } catch {
        dispatch(setLoading(false))
        router.push('/login')
      }
    }

    if (!isAuthenticated) {
      void restoreSession()
    } else {
      dispatch(setLoading(false))
    }
  }, [dispatch, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading OrgSphere...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <DocumentTitle />
      <LoadingBar />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
