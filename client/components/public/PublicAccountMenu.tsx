'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import api from '@/lib/axios'
import { Avatar } from '@/components/shared/Avatar'
import { RootState } from '@/store'
import { clearAuth, setCredentials } from '@/store/slices/authSlice'

export function PublicAccountMenu() {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      setCheckingSession(false)
      return
    }

    let active = true

    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        if (active) {
          dispatch(setCredentials(data))
        }
      } catch {
        // Public pages can remain anonymous when no refresh cookie is available.
      } finally {
        if (active) {
          setCheckingSession(false)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [dispatch, isAuthenticated])

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      dispatch(clearAuth())
      setMenuOpen(false)
      router.refresh()
    }
  }

  if (checkingSession) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        Login
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        <Avatar name={user.name} avatarPath={user.avatar_path} size="sm" />
        <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-11 z-40 w-48 rounded-lg bg-white p-1 shadow-[var(--shadow-modal)] ring-1 ring-gray-100">
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => setMenuOpen(false)}
          >
            Access Dashboard
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  )
}
