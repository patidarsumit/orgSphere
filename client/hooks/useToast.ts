'use client'

import { useDispatch } from 'react-redux'
import { addToast, ToastType } from '@/store/slices/uiSlice'

export function useToast() {
  const dispatch = useDispatch()

  const toast = (type: ToastType, message: string) => {
    dispatch(addToast({ type, message }))
  }

  return {
    success: (message: string) => toast('success', message),
    error: (message: string) => toast('error', message),
    warning: (message: string) => toast('warning', message),
    info: (message: string) => toast('info', message),
  }
}
