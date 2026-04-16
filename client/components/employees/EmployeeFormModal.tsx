'use client'

import { ChangeEvent, useState } from 'react'
import { isAxiosError } from 'axios'
import { Search, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { ZodError } from 'zod'
import { createEmployeeSchema, updateEmployeeSchema } from '@orgsphere/schemas'
import { Avatar } from '@/components/shared/Avatar'
import {
  useCreateEmployee,
  useEmployees,
  useUpdateEmployee,
  useUploadEmployeeAvatar,
} from '@/hooks/useEmployees'
import { addToast } from '@/store/slices/uiSlice'
import { Employee } from '@/types'
import { employeeRoles, roleLabels } from './constants'

interface EmployeeFormModalProps {
  open: boolean
  employee?: Employee
  onClose: () => void
}

interface EmployeeFormValues {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'tech_lead' | 'employee'
  department: string
  manager_id: string
}

const defaultValues: EmployeeFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  manager_id: '',
}

const errorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback
  }
  return fallback
}

const valuesForEmployee = (employee?: Employee): EmployeeFormValues =>
  employee
    ? {
        name: employee.name,
        email: employee.email,
        password: '',
        role: employee.role,
        department: employee.department || '',
        manager_id: employee.manager_id || '',
      }
    : defaultValues

export function EmployeeFormModal({ open, employee, onClose }: EmployeeFormModalProps) {
  if (!open) {
    return null
  }

  return (
    <EmployeeFormModalContent
      key={employee?.id || 'new-employee'}
      employee={employee}
      onClose={onClose}
    />
  )
}

function EmployeeFormModalContent({ employee, onClose }: Omit<EmployeeFormModalProps, 'open'>) {
  const dispatch = useDispatch()
  const [skills, setSkills] = useState<string[]>(() => employee?.skills || [])
  const [skillInput, setSkillInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [managerSearch, setManagerSearch] = useState('')
  const [selectedManagerId, setSelectedManagerId] = useState(employee?.manager_id || '')
  const [avatarPath, setAvatarPath] = useState(employee?.avatar_path || null)
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee(employee?.id || '')
  const uploadAvatar = useUploadEmployeeAvatar(employee?.id || '')
  const { data: managers } = useEmployees({ limit: 100, is_active: true })
  const isEdit = Boolean(employee)

  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<EmployeeFormValues>({
    defaultValues: valuesForEmployee(employee),
  })

  const managerOptions =
    managers?.data.filter((manager) => {
      const query = managerSearch.trim().toLowerCase()
      const isSelectable = manager.id !== employee?.id && manager.is_active
      if (!query) {
        return isSelectable
      }
      return isSelectable && manager.name.toLowerCase().includes(query)
    }) || []

  const addSkill = () => {
    const nextSkill = skillInput.trim()
    if (!nextSkill || skills.includes(nextSkill)) {
      setSkillInput('')
      return
    }
    setSkills((current) => [...current, nextSkill])
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setSkills((current) => current.filter((item) => item !== skill))
  }

  const onAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !employee) {
      return
    }

    try {
      const result = await uploadAvatar.mutateAsync(file)
      setAvatarPath(result.avatar_path)
      dispatch(addToast({ type: 'success', message: 'Avatar updated' }))
    } catch (error) {
      setFormError(errorMessage(error, 'Failed to upload avatar'))
    }
  }

  const onSubmit = async (values: EmployeeFormValues) => {
    setFormError(null)

    try {
      if (isEdit && employee) {
        const payload = updateEmployeeSchema.parse({
          name: values.name,
          role: values.role,
          department: values.department || null,
          manager_id: values.manager_id || null,
          skills,
        })
        await updateEmployee.mutateAsync(payload)
        dispatch(addToast({ type: 'success', message: 'Employee updated' }))
      } else {
        const payload = createEmployeeSchema.parse({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          department: values.department || undefined,
          manager_id: values.manager_id || null,
          skills,
        })
        await createEmployee.mutateAsync(payload)
        dispatch(addToast({ type: 'success', message: 'Employee created' }))
      }
      onClose()
    } catch (error) {
      if (error instanceof ZodError) {
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0]
          if (
            fieldName === 'name' ||
            fieldName === 'email' ||
            fieldName === 'password' ||
            fieldName === 'role' ||
            fieldName === 'department' ||
            fieldName === 'manager_id'
          ) {
            setError(fieldName, { type: 'validate', message: issue.message })
          }
        })
        setFormError(error.issues[0]?.message || 'Please check the form details')
        return
      }
      setFormError(errorMessage(error, 'Unable to save employee'))
    }
  }

  const isSaving = createEmployee.isPending || updateEmployee.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-text-primary)]/35 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-title"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white/95 shadow-[var(--shadow-modal)] backdrop-blur-md"
      >
        <div className="flex items-center justify-between bg-[color:var(--color-surface-low)] px-6 py-5">
          <div>
            <h2 id="employee-form-title" className="text-lg font-semibold text-[color:var(--color-text-primary)]">
              {isEdit ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-tertiary)]">
              {isEdit ? 'Update profile details and reporting lines.' : 'Create a directory profile.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[color:var(--color-text-tertiary)] hover:bg-white hover:text-[color:var(--color-text-primary)]"
            aria-label="Close employee form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
          {employee ? (
            <div className="flex items-center gap-4 rounded-xl bg-[color:var(--color-surface-low)] p-4">
              <label htmlFor="avatar" className="group relative cursor-pointer">
                <Avatar name={employee.name} avatarPath={avatarPath} size="xl" />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-900/60 text-center text-[10px] font-semibold uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Change
                </span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="avatar">
                  Profile photo
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onAvatarChange}
                  className="mt-2 block text-sm text-[color:var(--color-text-tertiary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--color-primary-light)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[color:var(--color-primary)] hover:file:bg-[color:var(--color-surface-highest)]"
                />
                {uploadAvatar.isPending ? (
                  <p className="mt-2 text-xs font-medium text-indigo-600">Uploading photo...</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Full name</span>
              <input
                {...register('name', { required: 'Name is required' })}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
              />
              {errors.name ? (
                <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Email</span>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                disabled={isEdit}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10 disabled:bg-[color:var(--color-surface-low)] disabled:text-[color:var(--color-text-tertiary)]"
              />
              {errors.email ? (
                <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
              ) : null}
            </label>

            {!isEdit ? (
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Password</span>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  type="password"
                  className="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
                />
                {errors.password ? (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors.password.message}
                  </span>
                ) : null}
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Role</span>
              <select
                {...register('role')}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-white px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
              >
                {employeeRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Department</span>
              <input
                {...register('department')}
                className="mt-1 h-10 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Manager</span>
              <input type="hidden" {...register('manager_id')} />
              <div className="mt-1 rounded-xl border border-[color:var(--color-border-strong)] bg-white p-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={managerSearch}
                    onChange={(event) => setManagerSearch(event.target.value)}
                    placeholder="Search managers"
                    className="h-9 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-low)] pl-8 pr-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
                  />
                </div>
                <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedManagerId('')
                      setValue('manager_id', '')
                    }}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${
                      selectedManagerId === ''
                        ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]'
                        : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'
                    }`}
                  >
                    No manager
                  </button>
                  {managerOptions.map((manager) => (
                    <button
                      key={manager.id}
                      type="button"
                      onClick={() => {
                        setSelectedManagerId(manager.id)
                        setValue('manager_id', manager.id)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${
                        selectedManagerId === manager.id
                          ? 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]'
                          : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-low)]'
                      }`}
                    >
                      <Avatar
                        name={manager.name}
                        avatarPath={manager.avatar_path}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {manager.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {roleLabels[manager.role]}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </label>
          </div>

          <div>
            <span className="text-sm font-medium text-[color:var(--color-text-secondary)]">Skills</span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="Add a skill"
                className="h-10 flex-1 rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-card)] px-3 text-sm outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/10"
              />
              <button
                type="button"
                onClick={addSkill}
                className="primary-gradient rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                Add Skill
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full bg-[color:var(--color-primary-light)] px-3 py-1 text-xs font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-highest)]"
                >
                  {skill} ×
                </button>
              ))}
            </div>
          </div>

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
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
