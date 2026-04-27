'use client'

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { colorForKey } from './chartTokens'

export interface BarInsightDatum {
  key: string
  label: string
  value: number
}

export function HorizontalBarInsightChart({
  data,
  emptyLabel = 'No data yet',
}: {
  data: BarInsightDatum[]
  emptyLabel?: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-lg bg-[color:var(--color-surface-low)] text-sm font-semibold text-[color:var(--color-text-tertiary)]">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="h-[260px] min-w-0 overflow-hidden">
      <BarChart width="100%" height={260} data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 12 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
        <YAxis
          type="category"
          dataKey="label"
          width={116}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={false}>
          {data.map((item, index) => (
            <Cell key={item.key} fill={colorForKey(item.key, index)} />
          ))}
        </Bar>
      </BarChart>
    </div>
  )
}
