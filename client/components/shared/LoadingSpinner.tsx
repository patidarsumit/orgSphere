const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
} as const

interface LoadingSpinnerProps {
  size?: keyof typeof sizeClasses
  fullPage?: boolean
}

export function LoadingSpinner({ size = 'md', fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-indigo-600 border-t-transparent`}
      aria-label="Loading"
    />
  )

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

