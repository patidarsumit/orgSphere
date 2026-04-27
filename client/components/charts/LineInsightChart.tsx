'use client'

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartEmptyState, MeasuredChartFrame } from './MeasuredChartFrame'

export interface LineInsightDatum {
  date: string
  count: number
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export function LineInsightChart({
  data,
  emptyLabel = 'No trend data yet',
}: {
  data: LineInsightDatum[]
  emptyLabel?: string
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (data.length === 0 || total === 0) {
    return <ChartEmptyState label={emptyLabel} height={240} />
  }

  return (
    <MeasuredChartFrame height={240}>
      {(width, height) => (
        <AreaChart width={width} height={height} data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="insightTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3525cd" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#3525cd" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip labelFormatter={(label) => formatDateLabel(String(label))} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#3525cd"
            strokeWidth={2}
            fill="url(#insightTrend)"
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </MeasuredChartFrame>
  )
}
