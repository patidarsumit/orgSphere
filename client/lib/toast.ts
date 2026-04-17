'use client'

import { toast } from 'sonner'
import { isAxiosError } from 'axios'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const toastByType = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
} satisfies Record<ToastType, (message: string, options?: Parameters<typeof toast>[1]) => string | number>

export const showToast = (
  type: ToastType,
  message: string,
  options?: Parameters<typeof toast>[1]
) => toastByType[type](message, options)

export const appToast = {
  success: (message: string, options?: Parameters<typeof toast>[1]) =>
    showToast('success', message, options),
  error: (message: string, options?: Parameters<typeof toast>[1]) =>
    showToast('error', message, options),
  warning: (message: string, options?: Parameters<typeof toast>[1]) =>
    showToast('warning', message, options),
  info: (message: string, options?: Parameters<typeof toast>[1]) =>
    showToast('info', message, options),
}

export const getToastErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
