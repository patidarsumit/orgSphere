'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { LoginInput, loginSchema, UserResponse } from '@orgsphere/schemas'
import api from '@/lib/axios'
import { setCredentials } from '@/store/slices/authSlice'
import { addToast } from '@/store/slices/uiSlice'

interface LoginResponse {
  user: UserResponse
  accessToken: string
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || 'Unable to sign in'
  }

  return 'Unable to sign in'
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const { data } = await api.post<LoginResponse>('/auth/login', values)
      return data
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data))
      router.push('/dashboard')
    },
    onError: (error) => {
      const message = getErrorMessage(error)
      dispatch(addToast({ type: 'error', message }))
      setToastMessage(message)
    },
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      {toastMessage ? (
        <div className="fixed right-5 top-5 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <section className="w-full max-w-[420px] rounded-xl bg-white p-8 ring-1 ring-gray-100">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <span className="h-3 w-3 rounded-full bg-indigo-600" />
            <span className="text-xl font-semibold text-gray-900">OrgSphere</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your workspace.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`h-11 w-full rounded-lg bg-gray-50 px-3 text-sm text-gray-900 outline-none ring-1 transition focus:bg-white focus:ring-2 ${
                errors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-100 focus:ring-indigo-600'
              }`}
              {...register('email')}
            />
            {errors.email ? (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`h-11 w-full rounded-lg bg-gray-50 px-3 pr-11 text-sm text-gray-900 outline-none ring-1 transition focus:bg-white focus:ring-2 ${
                  errors.password
                    ? 'ring-red-500 focus:ring-red-500'
                    : 'ring-gray-100 focus:ring-indigo-600'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs font-medium text-gray-400">or continue with</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <button
          type="button"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-gray-700 ring-1 ring-gray-100 transition hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </section>
    </main>
  )
}

