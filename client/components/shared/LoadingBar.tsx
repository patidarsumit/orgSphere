'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function LoadingBar() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 0)
    const showTimer = window.setTimeout(() => {
      setVisible(true)
      setWidth(70)
    }, 100)
    const completeTimer = window.setTimeout(() => setWidth(100), 450)
    const hideTimer = window.setTimeout(() => setVisible(false), 700)

    return () => {
      window.clearTimeout(resetTimer)
      window.clearTimeout(showTimer)
      window.clearTimeout(completeTimer)
      window.clearTimeout(hideTimer)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-[3px] bg-indigo-100">
      <div
        className="h-full bg-indigo-500 transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
