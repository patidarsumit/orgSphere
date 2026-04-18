import { LucideIcon } from 'lucide-react'

const accentStyles = {
  indigo: 'bg-indigo-50 text-indigo-600',
  teal: 'bg-teal-50 text-teal-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
} as const

type AccentColor = keyof typeof accentStyles

interface StatCardProps {
  title: string
  value?: number | string
  subtitle?: string
  trend?: string
  icon: LucideIcon
  accentColor?: AccentColor
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accentColor = 'indigo',
  isLoading = false,
}: StatCardProps) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
          {isLoading || value === undefined ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-md bg-gray-100" />
          ) : (
            <p className="mt-2 text-[32px] font-semibold leading-none text-gray-900">
              {value}
            </p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accentStyles[accentColor]}`}
        >
          <Icon size={20} />
        </div>
      </div>
      {subtitle ? <p className="mt-4 text-xs text-gray-500">{subtitle}</p> : null}
      {trend ? <p className="mt-3 text-xs font-medium text-green-600">{trend}</p> : null}
    </section>
  )
}

