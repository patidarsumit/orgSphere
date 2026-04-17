'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTaskSchema, CreateTaskInput } from '@orgsphere/schemas'
import { X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useUserProjects } from '@/hooks/useProjects'
import { appToast, getToastErrorMessage } from '@/lib/toast'
import { RootState } from '@/store'
import { Task } from '@/types'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaults?: Partial<CreateTaskInput>
}

const emptyValues: CreateTaskInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: null,
  project_id: null,
}

export function TaskFormModal({ open, onClose, task, defaults }: TaskFormModalProps) {
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const { data: userProjects = [] } = useUserProjects(currentUser?.id || '')
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const isEditing = Boolean(task)

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return

    form.reset({
      ...emptyValues,
      ...defaults,
      title: task?.title || defaults?.title || '',
      description: task?.description || defaults?.description || '',
      status: task?.status || defaults?.status || 'todo',
      priority: task?.priority || defaults?.priority || 'medium',
      due_date: task?.due_date || defaults?.due_date || null,
      project_id: task?.project_id || defaults?.project_id || null,
    })
  }, [defaults, form, open, task])

  if (!open) return null

  const onSubmit = async (values: CreateTaskInput) => {
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, ...values })
        appToast.success('Task updated')
      } else {
        await createTask.mutateAsync(values)
        appToast.success('Task created')
      }
      onClose()
    } catch (error) {
      appToast.error(getToastErrorMessage(error, task ? 'Unable to update task' : 'Unable to create task'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-[var(--shadow-modal)]">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--color-text-primary)]">
              {isEditing ? 'Edit Task' : 'Add Task'}
            </h2>
            <p className="text-sm text-[color:var(--color-text-tertiary)]">
              Keep your workspace moving with clear next steps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-[color:var(--color-surface-low)]"
            aria-label="Close task form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
          <label className="block">
            <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
              Title
            </span>
            <input
              {...form.register('title')}
              className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              placeholder="Write task title"
            />
            {form.formState.errors.title ? (
              <span className="mt-1 block text-xs text-red-600">
                {form.formState.errors.title.message}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
              Description
            </span>
            <textarea
              {...form.register('description')}
              rows={3}
              className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              placeholder="Add context"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Status
              </span>
              <select
                {...form.register('status')}
                className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              >
                <option value="todo">To-Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Priority
              </span>
              <select
                {...form.register('priority')}
                className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Due Date
              </span>
              <input
                type="date"
                {...form.register('due_date')}
                className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase text-[color:var(--color-text-tertiary)]">
                Project
              </span>
              <select
                {...form.register('project_id')}
                className="mt-2 w-full rounded-lg border border-[color:var(--color-border-strong)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/15"
              >
                <option value="">No project</option>
                {userProjects.map((membership) => (
                  <option key={membership.project.id} value={membership.project.id}>
                    {membership.project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-[color:var(--color-border)] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-bold text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending}
              className="primary-gradient rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
