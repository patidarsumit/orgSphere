'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

export function ChartEmptyState({
  label,
  height = 240,
}: {
  label: string
  height?: number
}) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-[color:var(--color-surface-low)] px-4 text-center text-sm font-semibold text-[color:var(--color-text-tertiary)]"
      style={{ minHeight: height }}
    >
      {label}
    </div>
  )
}

export function MeasuredChartFrame({
  height,
  children,
}: {
  height: number
  children: (width: number, height: number) => ReactNode
}) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = frameRef.current
    if (!element) return

    const updateWidth = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width)
      setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth))
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="min-w-0 overflow-hidden" style={{ height }}>
      {width > 0 ? children(width, height) : null}
    </div>
  )
}
