'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { LoginInput, loginSchema, UserResponse } from '@orgsphere/schemas'
import api from '@/lib/axios'
import { appToast } from '@/lib/toast'
import { RootState } from '@/store'
import { setCredentials } from '@/store/slices/authSlice'

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

const inputClassName = (hasError?: boolean) =>
  `h-11 w-full rounded-lg border bg-[color:var(--color-surface-card)] px-3 text-sm text-[color:var(--color-text-primary)] outline-none transition focus:bg-white focus:ring-2 ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-[color:var(--color-border)] focus:border-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]/20'
  }`

const workspaceStats = [
  { value: '42', label: 'Active teams' },
  { value: '128', label: 'Open projects' },
  { value: '94%', label: 'Roster clarity' },
]

const trustNotes = [
  'Secure session refresh across browser tabs',
  'Role-aware access for teams and projects',
  'People, teams, and delivery in one workspace',
]

export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

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
      appToast.error(message)
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
      return
    }

    if (!isLoading) {
      setCheckingSession(false)
    }
  }, [isAuthenticated, isLoading, router])

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-surface-low)] px-4 py-10">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-7 shadow-[var(--shadow-card)] ring-1 ring-[color:var(--color-border)]">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--color-primary)] border-t-transparent" />
          <div className="text-center">
            <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">Checking your session</p>
            <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">You will land in your workspace if you are already signed in.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[color:var(--color-surface-low)] px-4 py-8 text-[color:var(--color-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-[color:var(--color-border)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-[color:var(--color-text-primary)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <Sparkles size={18} />
              </span>
              <span className="text-lg font-semibold">OrgSphere</span>
            </div>

            <div className="mt-16 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 ring-1 ring-white/15">
                <ShieldCheck size={14} />
                Enterprise workspace
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight">
                Start with the right context.
              </h1>
              <p className="mt-5 text-base leading-7 text-white/70">
                Sign in to see project ownership, team relationships, and employee context without switching tools.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-3">
              {workspaceStats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/8 p-4 ring-1 ring-white/10">
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {trustNotes.map((note) => (
              <div key={note} className="flex items-center gap-3 text-sm text-white/75">
                <CheckCircle2 size={16} className="text-[color:var(--color-on-primary-container)]" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-8">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[color:var(--color-primary)]" />
                  <span className="text-xl font-semibold text-[color:var(--color-text-primary)]">OrgSphere</span>
                </div>
                <span className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[color:var(--color-primary)]">
                  Secure
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface-low)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                <UsersRound size={14} />
                Workspace access
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[color:var(--color-text-primary)]">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-tertiary)]">
                Continue to your OrgSphere workspace and pick up where your team left off.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={inputClassName(Boolean(errors.email))}
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`${inputClassName(Boolean(errors.password))} pr-11`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)] hover:text-[color:var(--color-text-primary)]"
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Sign in <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[color:var(--color-border)]" />
              <span className="text-xs font-medium text-[color:var(--color-text-tertiary)]">or continue with</span>
              <div className="h-px flex-1 bg-[color:var(--color-border)]" />
            </div>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-[color:var(--color-text-secondary)] ring-1 ring-[color:var(--color-border)] transition hover:bg-[color:var(--color-surface-low)]"
            >
              Sign in with Google
            </button>

            <p className="mt-8 text-center text-xs leading-5 text-[color:var(--color-text-tertiary)]">
              Protected workspace access for OrgSphere teams.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
