'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { DocumentTitle } from '@/components/layout/DocumentTitle'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { LoadingBar } from '@/components/shared/LoadingBar'
import { RootState } from '@/store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const logoutRedirect = window.sessionStorage.getItem('orgsphere:logout-redirect')
      if (logoutRedirect === 'home') {
        window.sessionStorage.removeItem('orgsphere:logout-redirect')
        router.push('/')
        return
      }

      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

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
