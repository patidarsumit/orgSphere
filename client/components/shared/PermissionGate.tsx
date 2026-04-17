'use client'

interface PermissionGateProps {
  allowed: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ allowed, children, fallback = null }: PermissionGateProps) {
  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
