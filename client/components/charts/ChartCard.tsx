import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  isLoading = false,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  children: ReactNode
  isLoading?: boolean
}) {
  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[color:var(--color-text-primary)]">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-5 text-[color:var(--color-text-tertiary)]">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-light)] text-[color:var(--color-primary)]">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <div className="h-[240px] animate-pulse rounded-lg bg-[color:var(--color-surface-low)]" />
      ) : (
        children
      )}
    </section>
  )
}
