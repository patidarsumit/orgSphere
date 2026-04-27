'use client'

import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { colorForKey, titleize } from './chartTokens'
import { ChartEmptyState } from './MeasuredChartFrame'

export interface DonutInsightDatum {
  key: string
  label: string
  value: number
}

export function DonutInsightChart({
  data,
  emptyLabel = 'No data yet',
}: {
  data: DonutInsightDatum[]
  emptyLabel?: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return <ChartEmptyState label={emptyLabel} height={240} />
  }

  return (
    <div className="grid min-h-[240px] grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="flex h-[180px] min-w-0 items-center justify-center">
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={54}
            outerRadius={78}
            paddingAngle={3}
            isAnimationActive={false}
          >
            {data.map((item, index) => (
              <Cell key={item.key} fill={colorForKey(item.key, index)} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [Number(value ?? 0), titleize(String(name))]} />
        </PieChart>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colorForKey(item.key, index) }}
              />
              <span className="truncate font-semibold text-[color:var(--color-text-secondary)]">
                {titleize(item.label)}
              </span>
            </span>
            <span className="font-black text-[color:var(--color-text-primary)]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
