'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { ZodError } from 'zod'
import { createTeamSchema, updateTeamSchema } from '@orgsphere/schemas'
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams'
import { addToast } from '@/store/slices/uiSlice'
import { Team } from '@/types'

interface TeamFormModalProps {
  open: boolean
  onClose: () => void
  team?: Team
}

interface TeamFormValues {
  name: string
  description: string
}

const defaultValues: TeamFormValues = {
  name: '',
  description: '',
}

const valuesForTeam = (team?: Team): TeamFormValues =>
  team
    ? {
        name: team.name,
        description: team.description || '',
      }
    : defaultValues

const errorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}

export function TeamFormModal({ open, onClose, team }: TeamFormModalProps) {
  if (!open) {
    return null
  }

  return (
    <TeamFormModalContent
      key={team?.id || 'new-team'}
      onClose={onClose}
      team={team}
    />
  )
}

function TeamFormModalContent({ onClose, team }: Omit<TeamFormModalProps, 'open'>) {
  const router = useRouter()
  const dispatch = useDispatch()
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam(team?.id || '')
  const [formError, setFormError] = useState<string | null>(null)
  const isEdit = Boolean(team)
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<TeamFormValues>({ defaultValues: valuesForTeam(team) })

  const onSubmit = async (values: TeamFormValues) => {
    setFormError(null)

    try {
      if (isEdit && team) {
        const payload = updateTeamSchema.parse({
          name: values.name,
          description: values.description || null,
        })
        await updateTeam.mutateAsync(payload)
        dispatch(addToast({ type: 'success', message: 'Team updated' }))
        onClose()
        return
      }

      const payload = createTeamSchema.parse({
        name: values.name,
        description: values.description || undefined,
      })
      const createdTeam = await createTeam.mutateAsync(payload)
      dispatch(addToast({ type: 'success', message: 'Team created' }))
      onClose()
      router.push(`/teams/${createdTeam.id}`)
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (fieldName === 'name' || fieldName === 'description') {
            setError(fieldName, { type: 'validate', message: issue.message })
          }
        })
        setFormError(error.issues[0]?.message || 'Please check the form details')
        return
      }

      setFormError(errorMessage(error, 'Unable to save team'))
    }
  }

  const isSaving = createTeam.isPending || updateTeam.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-form-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white/95 shadow-[var(--shadow-modal)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between bg-[color:var(--color-surface-low)] px-6 py-5">
          <div>
            <h2 id="team-form-title" className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {isEdit ? 'Edit Team' : 'Create Team'}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
              {isEdit ? 'Update the workspace details.' : 'Define a new collaboration space.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-white hover:text-[color:var(--color-text-primary)]"
            aria-label="Close team form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              Team name
            </span>
            <input
              {...register('name', { required: 'Team name is required' })}
              placeholder="e.g. Platform Team"
              className="mt-1 h-11 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
            />
            {errors.name ? (
              <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">
              Description
            </span>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What does this team work on?"
              className="mt-1 w-full resize-none rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 py-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
            />
            {errors.description ? (
              <span className="mt-1 block text-xs text-red-600">
                {errors.description.message}
              </span>
            ) : null}
          </label>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-3 border-t border-[color:var(--color-border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
