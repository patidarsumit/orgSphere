'use client'

import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UserResponse } from '@orgsphere/schemas'
import { RootState } from '@/store'
import { setCredentials, setLoading } from '@/store/slices/authSlice'

interface RefreshResponse {
  user: UserResponse
  accessToken: string
}

export function AuthBootstrap() {
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated || !isLoading) return

    let active = true

    const restoreSession = async () => {
      try {
        const { data } = await axios.post<RefreshResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        if (active) {
          dispatch(setCredentials(data))
        }
      } catch {
        if (active) {
          dispatch(setLoading(false))
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [dispatch, isAuthenticated, isLoading])

  return null
}
