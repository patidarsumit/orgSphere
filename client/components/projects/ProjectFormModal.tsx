'use client'

import { KeyboardEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAxiosError } from 'axios'
import { Plus, X } from 'lucide-react'
import { UseFormRegister, useForm } from 'react-hook-form'
import { ZodError } from 'zod'
import { createProjectSchema, updateProjectSchema } from '@orgsphere/schemas'
import { TechStackChip } from '@/components/shared/TechStackChip'
import { useEmployees } from '@/hooks/useEmployees'
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import { useTeams } from '@/hooks/useTeams'
import { appToast } from '@/lib/toast'
import { Project, ProjectStatus } from '@/types'
import { commonTech, projectStatusOptions } from './projectUtils'

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
  project?: Project
}

interface ProjectFormValues {
  name: string
  description: string
  status: ProjectStatus
  start_date: string
  team_id: string
  manager_id: string
  tech_lead_id: string
}

const defaultValues: ProjectFormValues = {
  name: '',
  description: '',
  status: 'active',
  start_date: '',
  team_id: '',
  manager_id: '',
  tech_lead_id: '',
}

const valuesForProject = (project?: Project): ProjectFormValues =>
  project
    ? {
        name: project.name,
        description: project.description || '',
        status: project.status,
        start_date: project.start_date || '',
        team_id: project.team_id || '',
        manager_id: project.manager_id || '',
        tech_lead_id: project.tech_lead_id || '',
      }
    : defaultValues

const errorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}

export function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  if (!open) {
    return null
  }

  return (
    <ProjectFormModalContent
      key={project?.id || 'new-project'}
      onClose={onClose}
      project={project}
    />
  )
}

function ProjectFormModalContent({ onClose, project }: Omit<ProjectFormModalProps, 'open'>) {
  const router = useRouter()
  const [techStack, setTechStack] = useState<string[]>(() => project?.tech_stack || [])
  const [techInput, setTechInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject(project?.id || '')
  const { data: employees } = useEmployees({ limit: 100, is_active: true })
  const { data: teams } = useTeams({ limit: 100 })
  const isEdit = Boolean(project)

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<ProjectFormValues>({
    defaultValues: valuesForProject(project),
  })

  const addTech = (value = techInput) => {
    const nextTech = value.trim()
    if (!nextTech || techStack.includes(nextTech)) {
      setTechInput('')
      return
    }
    setTechStack((current) => [...current, nextTech])
    setTechInput('')
  }

  const removeTech = (tech: string) => {
    setTechStack((current) => current.filter((item) => item !== tech))
  }

  const onTechKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTech()
    }
  }

  const onSubmit = async (values: ProjectFormValues) => {
    setFormError(null)

    try {
      const rawPayload = {
        name: values.name,
        description: values.description || undefined,
        status: values.status,
        tech_stack: techStack,
        start_date: values.start_date || undefined,
        team_id: values.team_id || null,
        manager_id: values.manager_id || null,
        tech_lead_id: values.tech_lead_id || null,
      }

      if (isEdit && project) {
        const payload = updateProjectSchema.parse({
          ...rawPayload,
          description: values.description || null,
          start_date: values.start_date || null,
        })
        await updateProject.mutateAsync(payload)
        appToast.success('Project updated')
        onClose()
        return
      }

      const payload = createProjectSchema.parse(rawPayload)
      const createdProject = await createProject.mutateAsync(payload)
      appToast.success('Project created')
      onClose()
      router.push(`/projects/${createdProject.id}`)
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (
            fieldName === 'name' ||
            fieldName === 'description' ||
            fieldName === 'status' ||
            fieldName === 'start_date' ||
            fieldName === 'team_id' ||
            fieldName === 'manager_id' ||
            fieldName === 'tech_lead_id'
          ) {
            setError(fieldName, { type: 'validate', message: issue.message })
          }
        })
        const message = error.issues[0]?.message || 'Please check the project details'
        setFormError(message)
        appToast.warning(message)
        return
      }
      const message = errorMessage(error, 'Unable to save project')
      setFormError(message)
      appToast.error(message)
    }
  }

  const isSaving = createProject.isPending || updateProject.isPending
  const employeeOptions = employees?.data || []
  const teamOptions = teams?.data || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white/95 shadow-[var(--shadow-modal)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between bg-[color:var(--color-surface-low)] px-6 py-5">
          <div>
            <h2 id="project-form-title" className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {isEdit ? 'Edit Project' : 'Add Project'}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
              Connect ownership, team assignment, and technology footprint.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-white hover:text-[color:var(--color-text-primary)]"
            aria-label="Close project form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
              Project Name
            </label>
            <input
              id="name"
              {...register('name', { required: 'Project name is required' })}
              className="mt-2 h-11 w-full rounded-xl border border-[color:var(--color-border)] px-4 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="mt-2 w-full rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
              Status
              <select {...register('status')} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20">
                {projectStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
              Start Date
              <input type="date" {...register('start_date')} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20" />
            </label>
          </div>

          <div>
            <label htmlFor="tech_stack" className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
              Tech Stack
            </label>
            <div className="mt-2 rounded-xl border border-[color:var(--color-border)] p-3">
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <button key={tech} type="button" onClick={() => removeTech(tech)} className="rounded-full" aria-label={`Remove ${tech}`}>
                    <TechStackChip tech={tech} />
                  </button>
                ))}
                <input id="tech_stack" value={techInput} onChange={(event) => setTechInput(event.target.value)} onKeyDown={onTechKeyDown} placeholder="Type and press Enter" className="min-w-44 flex-1 border-none text-sm outline-none" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {commonTech.map((tech) => (
                  <button key={tech} type="button" onClick={() => addTech(tech)} className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-low)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-primary-light)] hover:text-[color:var(--color-primary)]">
                    <Plus size={12} />
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
            Team
            <select {...register('team_id')} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20">
              <option value="">No team</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.members.length} members)
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PersonSelect label="Manager" field="manager_id" register={register} employees={employeeOptions} />
            <PersonSelect label="Tech Lead" field="tech_lead_id" register={register} employees={employeeOptions} />
          </div>

          {formError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-bold text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="primary-gradient rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PersonSelect({
  label,
  field,
  register,
  employees,
}: {
  label: string
  field: 'manager_id' | 'tech_lead_id'
  register: UseFormRegister<ProjectFormValues>
  employees: Array<{ id: string; name: string; role: string }>
}) {
  return (
    <label className="block text-sm font-semibold text-[color:var(--color-text-primary)]">
      {label}
      <select {...register(field)} className="mt-2 h-11 w-full rounded-xl border border-[color:var(--color-border)] px-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20">
        <option value="">Unassigned</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name} - {employee.role.replace('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  )
}
