'use client'

import { useEmployeeSkills } from '@/hooks/useEmployees'

interface SkillsFilterProps {
  value: string
  onChange: (skill: string) => void
}

export function SkillsFilter({ value, onChange }: SkillsFilterProps) {
  const { data: skills = [], isLoading } = useEmployeeSkills()

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 cursor-pointer rounded-xl border-none bg-[color:var(--color-surface-card)] px-4 text-sm text-[color:var(--color-text-secondary)] shadow-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
    >
      <option value="">All skills</option>
      {isLoading ? <option value="">Loading skills...</option> : null}
      {skills.map((skill) => (
        <option key={skill} value={skill}>
          {skill}
        </option>
      ))}
    </select>
  )
}
