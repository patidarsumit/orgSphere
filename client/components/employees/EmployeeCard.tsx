import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Employee } from '@/types'
import { roleLabels } from './constants'

interface EmployeeCardProps {
  employee: Employee
}

const initialsFor = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || 'O'
  const last = parts.length > 1 ? parts.at(-1)?.[0] : parts[0]?.[1]
  return `${first}${last || ''}`.toUpperCase()
}

function SquareEmployeeAvatar({ employee }: EmployeeCardProps) {
  if (employee.avatar_path) {
    const imageUrl = employee.avatar_path.startsWith('http')
      ? employee.avatar_path
      : `http://localhost:4000/${employee.avatar_path}`

    return (
      <Image
        src={imageUrl}
        alt={employee.name}
        width={64}
        height={64}
        unoptimized
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <span className="flex h-full w-full items-center justify-center bg-[color:var(--color-primary-light)] text-base font-bold text-[color:var(--color-primary)]">
      {initialsFor(employee.name)}
    </span>
  )
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const skills = employee.skills.slice(0, 2)
  const extraSkills = Math.max(employee.skills.length - skills.length, 0)
  const department = employee.department || 'Unassigned'
  const isEngineering = department.toLowerCase().includes('engineering')
  const badgeClass = isEngineering
    ? 'bg-[color:var(--color-tertiary-light)] text-[color:var(--color-tertiary)]'
    : 'bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]'

  return (
    <Link
      href={`/employees/${employee.id}`}
      className="group flex min-h-[238px] flex-col rounded-2xl bg-[color:var(--color-surface-card)] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_-18px_rgba(53,37,205,0.35)]"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--color-surface-low)] grayscale transition duration-500 group-hover:grayscale-0">
          <SquareEmployeeAvatar employee={employee} />
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
        >
          {department}
        </span>
      </div>

      <div className="mb-4">
        <h2 className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
          {employee.name}
        </h2>
        <p className="mt-0.5 text-xs text-[color:var(--color-text-tertiary)]">
          {roleLabels[employee.role]}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-[color:var(--color-surface-low)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-text-secondary)]"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-[color:var(--color-surface-low)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-text-tertiary)]">
            No skills
          </span>
        )}
        {extraSkills > 0 ? (
          <span className="rounded-full bg-[color:var(--color-surface-low)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-text-secondary)]">
            +{extraSkills}
          </span>
        ) : null}
      </div>

      <span className="mt-auto flex items-center gap-1 text-xs font-bold text-[color:var(--color-primary)] transition-transform group-hover:translate-x-1">
        View Profile
        <ArrowRight size={13} />
      </span>
    </Link>
  )
}
