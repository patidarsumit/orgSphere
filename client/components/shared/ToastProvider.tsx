'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import { RootState } from '@/store'
import { AppToast, removeToast } from '@/store/slices/uiSlice'

const toneByType = {
  success: { bar: 'bg-green-500', icon: CheckCircle },
  error: { bar: 'bg-red-500', icon: XCircle },
  warning: { bar: 'bg-amber-500', icon: AlertTriangle },
  info: { bar: 'bg-blue-500', icon: Info },
}

function ToastItem({ toast }: { toast: AppToast }) {
  const dispatch = useDispatch()
  const tone = toneByType[toast.type]
  const Icon = tone.icon

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch(removeToast(toast.id)), 4000)
    return () => window.clearTimeout(timer)
  }, [dispatch, toast.id])

  return (
    <div className="flex w-72 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-100">
      <span className={`w-1 ${tone.bar}`} />
      <div className="flex flex-1 items-start gap-3 p-3">
        <Icon size={16} className="mt-0.5 text-gray-500" />
        <p className="flex-1 text-sm font-medium leading-5 text-gray-800">{toast.message}</p>
        <button
          type="button"
          onClick={() => dispatch(removeToast(toast.id))}
          className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-900"
          aria-label="Dismiss toast"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider() {
  const toasts = useSelector((state: RootState) => state.ui.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
