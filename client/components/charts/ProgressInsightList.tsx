'use client'

import { ChartEmptyState } from './MeasuredChartFrame'

export interface ProgressInsightDatum {
  key: string
  label: string
  value: number
  detail?: string
}

export function ProgressInsightList({
  data,
  emptyLabel = 'No progress data yet',
}: {
  data: ProgressInsightDatum[]
  emptyLabel?: string
}) {
  if (data.length === 0) {
    return <ChartEmptyState label={emptyLabel} height={240} />
  }

  return (
    <div className="min-h-[240px] space-y-4">
      {data.map((item) => (
        <div key={item.key}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-bold text-[color:var(--color-text-primary)]">{item.label}</span>
            <span className="shrink-0 font-black text-[color:var(--color-primary)]">{item.value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-low)]">
            <span
              className="block h-full rounded-full bg-[color:var(--color-primary)]"
              style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
            />
          </div>
          {item.detail ? (
            <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">{item.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
